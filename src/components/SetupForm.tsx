import { useState, useEffect } from "react";
import QRCode from "qrcode";

export default function SetupForm() {
  const [form, setForm] = useState({
    name: "",
    prices: "",
    sheetId: ""
  });

  const [code, setCode] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔥 Convert QR string → image
  useEffect(() => {
    if (code) {
      QRCode.toDataURL(code).then(setQrImage);
    }
  }, [code]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("https://whatsapp-bot-saas-production-e234.up.railway.app/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      // 🔥 NOW EXPECT QR INSTEAD OF CODE
      if (data.qr) {
        setCode(data.qr);
      } else {
        alert("QR not generated");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Create Your WhatsApp Bot
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="Business Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full p-3 border rounded"
          required
        />

        <textarea
          placeholder="Price list (e.g Haircut - R80)"
          value={form.prices}
          onChange={(e) => setForm({ ...form, prices: e.target.value })}
          className="w-full p-3 border rounded"
          required
        />

        <input
          placeholder="Google Sheet ID"
          value={form.sheetId}
          onChange={(e) => setForm({ ...form, sheetId: e.target.value })}
          className="w-full p-3 border rounded"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-6 py-3 rounded w-full hover:bg-green-700"
        >
          {loading ? "Creating..." : "Create My Bot"}
        </button>
      </form>

      {/* 🔥 QR DISPLAY */}
      {qrImage && (
        <div className="mt-6 text-center bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-bold">Scan QR Code:</h2>
          <img src={qrImage} alt="QR Code" className="mx-auto mt-4" />
          <p className="mt-2 text-sm">
            WhatsApp → Settings → Linked Devices → Link a Device
          </p>
        </div>
      )}
    </div>
  );
}