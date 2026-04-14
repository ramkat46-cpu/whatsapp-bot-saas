import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import pkg from "@whiskeysockets/baileys";
import P from "pino";
import { google } from "googleapis";
import cors from "cors";

dotenv.config();

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = pkg;

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ============================
// GLOBAL STATE
// ============================
let clients = [];
let sockets = {};
let userSessions = {};
let rateLimits = {};
let bookings = [];

// ============================
// LOAD CLIENTS
// ============================
if (fs.existsSync("./clients.json")) {
  clients = JSON.parse(fs.readFileSync("./clients.json"));
}

// ============================
// GOOGLE SHEETS FUNCTION
// ============================
async function saveToSheet(client, booking) {
  try {
    console.log("📄 Saving to Google Sheets...");

    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/spreadsheets"]
    );

    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: client.sheetId,
      range: "Sheet1!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            new Date().toISOString(),
            booking.number,
            booking.name,
            booking.service,
            booking.datetime,
            "New"
          ]
        ]
      }
    });

    console.log("✅ Saved to Google Sheets");
  } catch (err) {
    console.error("❌ Google Sheets error:", err.message);
  }
}

// ============================
// RATE LIMIT
// ============================
function isRateLimited(number) {
  const now = Date.now();

  if (!rateLimits[number]) {
    rateLimits[number] = [];
  }

  rateLimits[number] = rateLimits[number].filter(
    (t) => now - t < 60000
  );

  rateLimits[number].push(now);

  return rateLimits[number].length > 10;
}

// ============================
// START CLIENT (BOT)
// ============================
async function startClient(client) {
  console.log(`🚀 Starting bot for ${client.name}`);

  const { state, saveCreds } = await useMultiFileAuthState(
    `./sessions/${client.id}`
  );

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" })
  });

  sockets[client.id] = sock;

  // ============================
  // CONNECTION
  // ============================
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      console.log(`✅ ${client.name} connected`);
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log(`❌ ${client.name} disconnected`);

      if (shouldReconnect) {
        startClient(client);
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // ============================
  // MESSAGE HANDLER (FIXED)
  // ============================
  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages[0];
      if (!msg.message) return;

      const from = msg.key.remoteJid;
      const isGroup = from.endsWith("@g.us");
      const isMe = msg.key.fromMe;

      if (isGroup || isMe) return;

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      const number = from.replace("@s.whatsapp.net", "");

      console.log(`📩 Message from ${number}: ${text}`);

      // RATE LIMIT
      if (isRateLimited(number)) {
        console.log("⛔ Rate limited:", number);
        return;
      }

      // INIT SESSION
      if (!userSessions[number]) {
        userSessions[number] = { step: "menu" };
      }

      const session = userSessions[number];

      // ============================
      // GREETING
      // ============================
      if (
        ["hi", "hello", "hey"].includes(text.toLowerCase())
      ) {
        session.step = "menu";

        await sock.sendMessage(from, {
          text: `👋 Welcome to ${client.name}

1️⃣ Book Appointment
2️⃣ View Prices
3️⃣ Talk to Owner`
        });

        return;
      }

      // ============================
      // MENU
      // ============================
      if (session.step === "menu") {
        if (text === "1") {
          session.step = "service";

          await sock.sendMessage(from, {
            text: "💈 What service would you like?"
          });
        }

        else if (text === "2") {
          await sock.sendMessage(from, {
            text: `💵 Prices:\n${client.prices}`
          });
        }

        else if (text === "3") {
          await sock.sendMessage(from, {
            text: "📞 Owner will contact you shortly."
          });

          await sock.sendMessage(
            `${process.env.OWNER_NUMBER}@s.whatsapp.net`,
            {
              text: `📢 Customer wants to talk: ${number}`
            }
          );
        }

        return;
      }

      // ============================
      // BOOKING FLOW
      // ============================

      if (session.step === "service") {
        session.service = text;
        session.step = "datetime";

        await sock.sendMessage(from, {
          text: "📅 Enter date & time:"
        });
        return;
      }

      if (session.step === "datetime") {
        session.datetime = text;
        session.step = "name";

        await sock.sendMessage(from, {
          text: "👤 Your name?"
        });
        return;
      }

      if (session.step === "name") {
        session.name = text;
        session.step = "confirm";

        await sock.sendMessage(from, {
          text: `✅ Confirm booking:

Service: ${session.service}
Date: ${session.datetime}
Name: ${session.name}

Reply YES to confirm`
        });

        return;
      }

      if (session.step === "confirm") {
        if (text.toLowerCase() === "yes") {
          const booking = {
            number,
            service: session.service,
            datetime: session.datetime,
            name: session.name
          };

          bookings.push(booking);

          await saveToSheet(client, booking);

          await sock.sendMessage(from, {
            text: "🎉 Booking confirmed!"
          });

          await sock.sendMessage(
            `${process.env.OWNER_NUMBER}@s.whatsapp.net`,
            {
              text: `📅 New Booking!

Name: ${booking.name}
Service: ${booking.service}
Date: ${booking.datetime}
Number: ${booking.number}`
            }
          );

          delete userSessions[number];
        }
      }
    } catch (err) {
      console.error("❌ Message error:", err);
    }
  });
}

// ============================
// START ALL CLIENTS ON BOOT
// ============================
(async () => {
  console.log("🔄 Loading clients...");
  for (const client of clients) {
    await startClient(client);
  }
})();

// ============================
// SETUP ENDPOINT (FIXED)
// ============================
app.post("/setup", async (req, res) => {
  try {
    const { id, name, prices, sheetId } = req.body;

    const client = { id, name, prices, sheetId };
    clients.push(client);

    fs.writeFileSync("./clients.json", JSON.stringify(clients, null, 2));

    const { state, saveCreds } = await useMultiFileAuthState(
      `./sessions/${id}`
    );

    const sock = makeWASocket({
      auth: state,
      logger: P({ level: "silent" })
    });

    let responded = false;

    sock.ev.on("connection.update", (update) => {
      if (update.qr && !responded) {
        responded = true;

        console.log("📱 QR Generated");

        res.json({ qr: update.qr });

        startClient(client);
      }
    });

    sock.ev.on("creds.update", saveCreds);

    setTimeout(() => {
      if (!responded) {
        res.status(500).json({ error: "QR timeout" });
      }
    }, 15000);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Setup failed" });
  }
});

// ============================
// BOOKINGS ENDPOINT
// ============================
app.get("/bookings", (req, res) => {
  const password = req.headers["password"];

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json(bookings);
});

app.use(cors({
  origin: process.env.FRONTEND_URL
}));

// ============================
// START SERVER
// ============================
app.listen(PORT, () => {
  console.log(`🌍 Server running on port ${PORT}`);
});