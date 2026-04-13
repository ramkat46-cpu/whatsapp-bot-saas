import { useState } from "react"

export default function SetupForm() {
  const [form, setForm] = useState({
    name: "",
    prices: "",
    sheetId: ""
  })

  const [code, setCode] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

    const res = await fetch("https://YOUR-BACKEND-URL/setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    })

    const data = await res.json()

    if (data.code) {
      setCode(data.code)
    }
  }

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="Business Name"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full p-3 border rounded"
        />

        <textarea
          placeholder="Price list"
          onChange={(e) => setForm({ ...form, prices: e.target.value })}
          className="w-full p-3 border rounded"
        />

        <input
          placeholder="Google Sheet ID"
          onChange={(e) => setForm({ ...form, sheetId: e.target.value })}
          className="w-full p-3 border rounded"
        />

        <button className="bg-green-600 text-white px-6 py-3 rounded">
          Create My Bot
        </button>
      </form>

      {code && (
        <div className="mt-6 text-center">
          <h2 className="text-xl font-bold">Your Pairing Code:</h2>
          <p className="text-2xl mt-2">{code}</p>
          <p className="mt-2">Enter this in WhatsApp → Linked Devices</p>
        </div>
      )}
    </div>
  )
}