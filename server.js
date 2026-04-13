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

// ================= GOOGLE =================
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
      browser: ['Ubuntu', 'Chrome', '20.0.04'] // 🔥 IMPORTANT
    })

    sock.ev.on('creds.update', saveCreds)

    // 🔥 FORCE PAIRING
    setTimeout(async () => {
      if (!state.creds.registered) {
        try {
          console.log('⚡ Requesting pairing code...')
          const code = await sock.requestPairingCode(process.env.PAIRING_NUMBER)
          console.log('\n📱 PAIRING CODE:\n', code, '\n')
        } catch (err) {
          console.log('Pairing error:', err.message)
        }
      }
    }, 2000)

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update

      if (connection === 'open') {
        console.log(`✅ ${client.name} connected`)
      }

      if (connection === 'close') {
        console.log('❌ Disconnected:', lastDisconnect?.error?.message)
        setTimeout(() => startClient(client), 5000)
      }
    })

    // ================= MESSAGE HANDLER =================
    sock.ev.on('messages.upsert', async ({ messages }) => {
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
          await send(`Welcome to ${client.name} 👋\n1 - Book\n2 - Prices\n3 - Owner`)
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
          } catch {}

          session = { step: 0, data: {} }
          break
      }

      db.data.sessions[from] = session
      await db.write()
    })

  } catch (err) {
    console.error('Client error:', err.message)
  }
}

// ================= LOAD CLIENTS =================
getClients().forEach(startClient)

// ================= SETUP =================
app.post('/setup', (req, res) => {
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

  startClient(newClient)

  res.json({ success: true })
})

// ================= START =================
app.listen(process.env.PORT || 3000, () =>
  console.log('🚀 Server running on port 3000')
)