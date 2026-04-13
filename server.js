import express from 'express'
import dotenv from 'dotenv'
import { makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys'
import { google } from 'googleapis'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const app = express()
app.use(express.json())

// ================= PATH =================
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.static(path.join(__dirname, 'dist')))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// ================= DB =================
const adapter = new JSONFile('db.json')
const db = new Low(adapter, { sessions: {} })

await db.read()
db.data ||= { sessions: {} }
await db.write()

// ================= CLIENTS =================
const getClients = () => {
  if (!fs.existsSync('clients.json')) return []
  return JSON.parse(fs.readFileSync('clients.json'))
}

const saveClients = (data) =>
  fs.writeFileSync('clients.json', JSON.stringify(data, null, 2))

// ================= GOOGLE SHEETS =================
const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets']
)

const sheets = google.sheets({ version: 'v4', auth })

// ================= RATE LIMIT =================
const rateLimit = {}

function isRateLimited(user) {
  const now = Date.now()
  if (!rateLimit[user]) rateLimit[user] = []

  rateLimit[user] = rateLimit[user].filter(t => now - t < 10000)

  if (rateLimit[user].length >= 5) return true

  rateLimit[user].push(now)
  return false
}

// ================= WHATSAPP =================
async function startClient(client) {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(`auth_${client.id}`)

    const sock = makeWASocket({
      auth: state,
      browser: ['Windows', 'Chrome', '10'],
      syncFullHistory: false,
      markOnlineOnConnect: false,
      defaultQueryTimeoutMs: 0
    })

    // 🔥 CONNECTION HANDLER
    sock.ev.on('connection.update', async (update) => {
      const { connection } = update

      if (connection === 'open') {
        console.log(`✅ ${client.name} connected`)
      }

      if (connection === 'close') {
        console.log('❌ Disconnected. Reconnecting...')
        setTimeout(() => startClient(client), 5000)
      }
    })

    sock.ev.on('creds.update', saveCreds)

    // ================= MESSAGE HANDLER =================
    sock.ev.on('messages.upsert', async ({ messages }) => {
      try {
        const msg = messages[0]
        if (!msg.message) return

        const from = msg.key.remoteJid
        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text

        if (!text) return
        if (isRateLimited(from)) return

        let session = db.data.sessions[from] || { step: 0, data: {} }

        const send = (t) => sock.sendMessage(from, { text: t })

        if (text === '0') session = { step: 0, data: {} }

        switch (session.step) {
          case 0:
            await send(
              `Welcome to ${client.name} 👋 Reply:\n1 - Book\n2 - Prices\n3 - Owner`
            )
            session.step = 1
            break

          case 1:
            if (text === '1') {
              await send('What service?')
              session.step = 2
            } else if (text === '2') {
              await send(client.prices)
            } else if (text === '3') {
              await send('Connecting to owner...')
              await sock.sendMessage(
                `${process.env.OWNER_NUMBER}@s.whatsapp.net`,
                { text: `New customer: ${from}` }
              )
            } else {
              await send('Reply 1, 2 or 3')
            }
            break

          case 2:
            session.data.service = text
            await send('Date & time?')
            session.step = 3
            break

          case 3:
            session.data.datetime = text
            await send('Your name?')
            session.step = 4
            break

          case 4:
            session.data.name = text

            await send('Booking confirmed ✅')

            try {
              await sheets.spreadsheets.values.append({
                spreadsheetId: client.sheetId,
                range: 'Sheet1!A:F',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                  values: [[
                    new Date().toISOString(),
                    from,
                    session.data.name,
                    session.data.service,
                    session.data.datetime,
                    'New'
                  ]]
                }
              })
            } catch (err) {
              console.error('Sheets error:', err.message)
            }

            session = { step: 0, data: {} }
            break
        }

        db.data.sessions[from] = session
        await db.write()

      } catch (err) {
        console.error('Message error:', err.message)
      }
    })

  } catch (err) {
    console.error('Client error:', err.message)
  }
}

// ================= LOAD EXISTING CLIENTS =================
const clients = getClients()
clients.forEach(client => startClient(client))

// ================= SETUP (🔥 FIXED) =================
app.post('/setup', async (req, res) => {
  try {
    const { name, prices, sheetId } = req.body

    if (!name || !prices || !sheetId) {
      return res.status(400).json({ error: 'Missing fields' })
    }

    const clients = getClients()

    const newClient = {
      id: uuidv4(),
      name,
      prices,
      sheetId
    }

    clients.push(newClient)
    saveClients(clients)

    // 🔥 GET PAIRING CODE
    const { state } = await useMultiFileAuthState(`auth_${newClient.id}`)

    const sock = makeWASocket({
      auth: state,
      browser: ['Windows', 'Chrome', '10']
    })

    let pairingCode = null

    if (!sock.authState.creds.registered) {
      pairingCode = await sock.requestPairingCode(process.env.PAIRING_NUMBER)
    }

    // start bot
    startClient(newClient)

    res.json({
      success: true,
      code: pairingCode
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Setup failed' })
  }
})

// ================= ADMIN =================
app.get('/admin', (req, res) => {
  if (req.query.password !== process.env.ADMIN_PASSWORD) {
    return res.send('Unauthorized')
  }

  res.sendFile(path.join(__dirname, 'admin.html'))
})

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// ================= START =================
app.listen(process.env.PORT || 3000, () =>
  console.log('🚀 Server running on port 3000')
)