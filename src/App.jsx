import { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function AddMedication({ onAdded }) {
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [time, setTime] = useState('08:00')
  const [times, setTimes] = useState(['08:00'])
  const [notes, setNotes] = useState('')

  const addTime = () => {
    if (time && !times.includes(time)) setTimes([...times, time])
  }
  const removeTime = (t) => setTimes(times.filter(x => x !== t))

  const submit = async (e) => {
    e.preventDefault()
    if (!name || !dosage || times.length === 0) return
    const payload = { name, dosage, times, days: [0,1,2,3,4,5,6], notes, active: true }
    const res = await fetch(`${API_BASE}/api/medications`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    })
    if (res.ok) {
      setName(''); setDosage(''); setTimes(['08:00']); setNotes('')
      onAdded && onAdded()
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <h2 className="text-xl font-bold mb-4">Add Medication</h2>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-lg">Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full border rounded-lg p-3 text-lg" placeholder="e.g., Metformin" />
        </div>
        <div>
          <label className="block text-lg">Dosage</label>
          <input value={dosage} onChange={e=>setDosage(e.target.value)} className="mt-1 w-full border rounded-lg p-3 text-lg" placeholder="e.g., 1 pill" />
        </div>
        <div>
          <label className="block text-lg mb-2">Times per day</label>
          <div className="flex items-center gap-2">
            <input type="time" value={time} onChange={e=>setTime(e.target.value)} className="border rounded-lg p-3 text-lg" />
            <button type="button" onClick={addTime} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Add time</button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {times.map(t => (
              <span key={t} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-lg flex items-center gap-2">
                {t}
                <button type="button" onClick={()=>removeTime(t)} className="text-red-600 text-lg">×</button>
              </span>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-lg">Notes</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} className="mt-1 w-full border rounded-lg p-3 text-lg" placeholder="Add any notes" />
        </div>
        <button className="w-full bg-green-600 text-white py-3 rounded-lg text-xl">Save Medication</button>
      </form>
    </div>
  )
}

function MedicationList({ meds, onLog }) {
  const today = new Date()
  const y = today.getFullYear(); const m = String(today.getMonth()+1).padStart(2,'0'); const d = String(today.getDate()).padStart(2,'0')
  const dateStr = `${y}-${m}-${d}`

  const markTaken = async (med, t) => {
    await fetch(`${API_BASE}/api/intakes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ medication_id: med.id, time: t, date: dateStr, taken_at: new Date().toISOString() })
    })
    onLog && onLog()
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <h2 className="text-xl font-bold mb-4">Today's Schedule</h2>
      {meds.length === 0 ? (
        <p className="text-gray-600 text-lg">No medications yet. Add one on the left.</p>
      ) : (
        <div className="space-y-4">
          {meds.map(med => (
            <div key={med.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-semibold">{med.name}</p>
                  <p className="text-gray-600 text-lg">{med.dosage}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {med.times.map(t => (
                  <button key={t} onClick={()=>markTaken(med, t)} className="px-3 py-2 rounded-full bg-emerald-100 text-emerald-800 text-lg">{t} • Mark taken</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function History({ refreshKey }) {
  const [items, setItems] = useState([])
  useEffect(() => { load() }, [refreshKey])
  const load = async () => {
    const res = await fetch(`${API_BASE}/api/intakes`)
    if (res.ok) setItems(await res.json())
  }
  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <h2 className="text-xl font-bold mb-4">History</h2>
      {items.length === 0 ? <p className="text-gray-600 text-lg">No intakes logged yet.</p> : (
        <ul className="space-y-2">
          {items.map(i => (
            <li key={i.id} className="border rounded-lg p-3 text-lg">
              <span className="font-semibold">{i.date}</span> at {i.time}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function App() {
  const [meds, setMeds] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)
  const loadMeds = async () => {
    const res = await fetch(`${API_BASE}/api/medications`)
    if (res.ok) setMeds(await res.json())
  }
  useEffect(() => { loadMeds() }, [refreshKey])

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-emerald-50 p-6">
      <header className="text-center mb-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-emerald-800">Pill Reminder</h1>
        <p className="text-xl text-emerald-700 mt-2">Simple, large-text tracker for daily medications</p>
      </header>

      <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        <AddMedication onAdded={() => setRefreshKey(k=>k+1)} />
        <MedicationList meds={meds} onLog={() => setRefreshKey(k=>k+1)} />
      </div>

      <div className="max-w-6xl mx-auto mt-6">
        <History refreshKey={refreshKey} />
      </div>
    </div>
  )
}

export default App
