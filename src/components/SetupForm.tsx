import { useState } from "react";

export default function SetupForm() {
  const [form, setForm] = useState({
    name: "",
    prices: "",
    sheetId: ""
  });

  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

      if (data.code) {
        setCode(data.code);
      } else {
        alert("No pairing code returned");
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

      {code && (
        <div className="mt-6 text-center bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-bold">Your Pairing Code:</h2>
          <p className="text-2xl mt-2 font-mono">{code}</p>
          <p className="mt-2 text-sm">
            WhatsApp → Settings → Linked Devices → Link a Device
          </p>
        </div>
      )}
    </div>
  );
}