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

// ================= SETUP (QR FIXED) =================
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

    const { state, saveCreds } = await useMultiFileAuthState(`auth_${newClient.id}`)

    const sock = makeWASocket({
      auth: state,
      browser: ['Windows', 'Chrome', '10']
    })

    sock.ev.on('creds.update', saveCreds)

    // 🔥 WAIT FOR QR AND SEND IT
    sock.ev.on('connection.update', (update) => {
      const { qr, connection } = update

      if (qr) {
        console.log('📱 QR GENERATED')

        // send QR ONCE
        res.json({
          success: true,
          qr: qr
        })
      }

      if (connection === 'open') {
        console.log(`✅ ${newClient.name} connected`)
      }
    })

    startClient(newClient)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Setup failed' })
  }
})

// ================= START =================
app.listen(process.env.PORT || 3000, () =>
  console.log('🚀 Server running on port 3000')
)