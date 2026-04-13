import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
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
app.use(cors())

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

// ================= WHATSAPP =================
async function startClient(client) {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(`auth_${client.id}`)

    const sock = makeWASocket({
      auth: state,
      browser: ['Windows', 'Chrome', '10']
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
      const { connection } = update

      if (connection === 'open') {
        console.log(`✅ ${client.name} connected`)
      }

      if (connection === 'close') {
        console.log('❌ Disconnected, retrying...')
        setTimeout(() => startClient(client), 5000)
      }
    })

  } catch (err) {
    console.error('Client error:', err.message)
  }
}

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

    // 🔥 AUTH STATE
    const { state, saveCreds } = await useMultiFileAuthState(`auth_${newClient.id}`)

    const sock = makeWASocket({
      auth: state,
      browser: ['Windows', 'Chrome', '10']
    })

    // 🔥 FORCE PAIRING CODE (NO CHECK)
    console.log('⚡ Requesting pairing code...')
    const pairingCode = await sock.requestPairingCode(process.env.PAIRING_NUMBER)
    console.log('📱 CODE:', pairingCode)

    sock.ev.on('creds.update', saveCreds)

    // start bot after pairing request
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

// ================= START =================
app.listen(process.env.PORT || 3000, () =>
  console.log('🚀 Server running on port 3000')
)