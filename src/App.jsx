import { useEffect, useMemo, useRef, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function parseQuery() {
  const qs = new URLSearchParams(window.location.search)
  return { share: qs.get('share') || null }
}

function AddMedication({ onAdded, disabled }) {
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [time, setTime] = useState('08:00')
  const [times, setTimes] = useState(['08:00'])
  const [notes, setNotes] = useState('')
  const [days, setDays] = useState([0,1,2,3,4,5,6])

  const addTime = () => {
    if (time && !times.includes(time)) setTimes([...times, time])
  }
  const removeTime = (t) => setTimes(times.filter(x => x !== t))

  const toggleDay = (d) => {
    setDays(prev => prev.includes(d) ? prev.filter(x => x!==d) : [...prev, d])
  }

  const submit = async (e) => {
    e.preventDefault()
    if (disabled) return
    if (!name || !dosage || times.length === 0) return
    const payload = { name, dosage, times, days: days.sort((a,b)=>a-b), notes, active: true }
    const res = await fetch(`${API_BASE}/api/medications`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    })
    if (res.ok) {
      setName(''); setDosage(''); setTimes(['08:00']); setNotes(''); setDays([0,1,2,3,4,5,6])
      onAdded && onAdded()
    }
  }

  return (
    <div className={`bg-white rounded-xl p-6 shadow-md ${disabled?'opacity-60 pointer-events-none':''}`}>
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
          <label className="block text-lg mb-2">Active days</label>
          <div className="grid grid-cols-7 gap-2 text-center">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((lbl, idx) => (
              <button type="button" key={lbl} onClick={()=>toggleDay(idx)} className={`py-2 rounded-lg text-lg border ${days.includes(idx)?'bg-emerald-600 text-white border-emerald-600':'bg-gray-50 text-gray-800'}`}>{lbl}</button>
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

function MedicationList({ meds, onLog, readOnly }) {
  const today = new Date()
  const y = today.getFullYear(); const m = String(today.getMonth()+1).padStart(2,'0'); const d = String(today.getDate()).padStart(2,'0')
  const dateStr = `${y}-${m}-${d}`

  const markTaken = async (med, t) => {
    if (readOnly) return
    await fetch(`${API_BASE}/api/intakes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ medication_id: med.id, time: t, date: dateStr, taken_at: new Date().toISOString() })
    })
    onLog && onLog()
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <h2 className="text-xl font-bold mb-4">Today's Schedule</h2>
      {meds.length === 0 ? (
        <p className="text-gray-600 text-lg">No medications yet. {readOnly? '':''}Add one on the left.</p>
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
                  <button key={t} onClick={()=>markTaken(med, t)} className={`px-3 py-2 rounded-full text-lg ${readOnly? 'bg-gray-100 text-gray-500 cursor-not-allowed':'bg-emerald-100 text-emerald-800'}`}>{t}{readOnly? '' : ' • Mark taken'}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function History({ refreshKey, sharedToken }) {
  const [items, setItems] = useState([])
  useEffect(() => { load() }, [refreshKey, sharedToken])
  const load = async () => {
    const url = sharedToken ? `${API_BASE}/api/share/${sharedToken}/intakes` : `${API_BASE}/api/intakes`
    const res = await fetch(url)
    if (res.ok) setItems(await res.json())
  }
  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <h2 className="text-xl font-bold mb-4">History</h2>
      {items.length === 0 ? <p className="text-gray-600 text-lg">No intakes logged yet.</p> : (
        <ul className="space-y-2">
          {items.map(i => (
            <li key={i.id || `${i.medication_id}-${i.date}-${i.time}` } className="border rounded-lg p-3 text-lg">
              <span className="font-semibold">{i.date}</span> at {i.time}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Notifications({ schedule }) {
  const [enabled, setEnabled] = useState(Notification?.permission === 'granted')
  const timersRef = useRef([])

  useEffect(() => {
    // clear timers on unmount or schedule change
    return () => {
      timersRef.current.forEach(id => clearTimeout(id))
      timersRef.current = []
    }
  }, [schedule])

  const request = async () => {
    if (!('Notification' in window)) {
      alert('Notifications are not supported in this browser.')
      return
    }
    const perm = await Notification.requestPermission()
    setEnabled(perm === 'granted')
  }

  useEffect(() => {
    if (!enabled || !schedule?.items) return
    // schedule notifications for remaining times today
    timersRef.current.forEach(id => clearTimeout(id))
    timersRef.current = []
    const now = new Date()
    const tzOffset = now.getTimezoneOffset()
    schedule.items.forEach(item => {
      const [hh, mm] = item.time.split(':').map(Number)
      const dt = new Date(`${schedule.date}T${item.time}:00`)
      const ms = dt.getTime() - now.getTime()
      if (ms > 0) {
        const id = setTimeout(() => {
          try {
            new Notification('Medication Reminder', {
              body: `${item.name} • ${item.dosage} at ${item.time}`,
              tag: `${item.medication_id}-${item.time}-${schedule.date}`
            })
          } catch {}
        }, ms)
        timersRef.current.push(id)
      }
    })
  }, [enabled, schedule])

  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <h2 className="text-xl font-bold mb-2">Reminders</h2>
      <p className="text-gray-700 mb-3 text-lg">Enable browser notifications for upcoming doses today.</p>
      {enabled ? (
        <div className="flex items-center gap-2 text-emerald-700 font-semibold"><span>✅ Notifications enabled</span></div>
      ) : (
        <button onClick={request} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-lg">Enable reminders</button>
      )}
    </div>
  )}

function SharePanel() {
  const [link, setLink] = useState(null)
  const [loading, setLoading] = useState(false)

  const create = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/share/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      if (res.ok) {
        const data = await res.json()
        const url = data.url && data.url !== data.token ? data.url : `${window.location.origin}/?share=${data.token}`
        setLink(url)
      }
    } finally { setLoading(false) }
  }

  const copy = async () => {
    if (!link) return
    try { await navigator.clipboard.writeText(link) } catch {}
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <h2 className="text-xl font-bold mb-2">Caregiver Sharing</h2>
      <p className="text-gray-700 text-lg mb-3">Create a read-only link to share your schedule and history.</p>
      <button onClick={create} disabled={loading} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-lg">{loading ? 'Creating…' : 'Create share link'}</button>
      {link && (
        <div className="mt-3">
          <input readOnly value={link} className="w-full border rounded-lg p-3 text-lg" />
          <button onClick={copy} className="mt-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-lg w-full">Copy link</button>
        </div>
      )}
    </div>
  )
}

function CalendarView({ sharedToken }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10))
  const [schedule, setSchedule] = useState({ date, items: [] })

  useEffect(() => { load() }, [date, sharedToken])
  const load = async () => {
    const qs = new URLSearchParams({ date })
    const url = sharedToken ? `${API_BASE}/api/share/${sharedToken}/schedule?${qs}` : `${API_BASE}/api/schedule?${qs}`
    const res = await fetch(url)
    if (res.ok) setSchedule(await res.json())
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">Calendar</h2>
          <p className="text-gray-600">Pick a date to see planned doses.</p>
        </div>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="border rounded-lg p-3 text-lg" />
      </div>
      <div className="mt-4">
        {schedule.items?.length ? (
          <ul className="space-y-2">
            {schedule.items.map((i, idx) => (
              <li key={idx} className="border rounded-lg p-3 text-lg flex items-center justify-between">
                <div>
                  <div className="font-semibold">{i.name}</div>
                  <div className="text-gray-600">{i.dosage}</div>
                </div>
                <div className="text-emerald-700 font-semibold text-xl">{i.time}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 text-lg">No scheduled doses for this date.</p>
        )}
      </div>
    </div>
  )
}

function App() {
  const { share: sharedToken } = useMemo(() => parseQuery(), [])

  const [meds, setMeds] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [schedule, setSchedule] = useState(null)

  const loadMeds = async () => {
    if (sharedToken) {
      // In shared view, build meds from schedule for today
      const res = await fetch(`${API_BASE}/api/share/${sharedToken}/schedule`)
      if (res.ok) {
        const sched = await res.json()
        setSchedule(sched)
        // group items by medication_id
        const grouped = {}
        sched.items.forEach(i => {
          if (!grouped[i.medication_id]) grouped[i.medication_id] = { id: i.medication_id, name: i.name, dosage: i.dosage, times: [] }
          grouped[i.medication_id].times.push(i.time)
        })
        setMeds(Object.values(grouped))
      }
    } else {
      const [resMeds, resSched] = await Promise.all([
        fetch(`${API_BASE}/api/medications`),
        fetch(`${API_BASE}/api/schedule`)
      ])
      if (resMeds.ok) setMeds(await resMeds.json())
      if (resSched.ok) setSchedule(await resSched.json())
    }
  }

  useEffect(() => { loadMeds() }, [refreshKey, sharedToken])

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-emerald-50 p-6">
      <header className="text-center mb-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-emerald-800">Pill Reminder</h1>
        <p className="text-xl text-emerald-700 mt-2">Simple, large-text tracker for daily medications</p>
        {sharedToken && <p className="mt-2 text-purple-700 font-semibold text-lg">Caregiver View (read-only)</p>}
      </header>

      <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        <AddMedication onAdded={() => setRefreshKey(k=>k+1)} disabled={!!sharedToken} />
        <div className="space-y-6">
          <MedicationList meds={meds} onLog={() => setRefreshKey(k=>k+1)} readOnly={!!sharedToken} />
          {!sharedToken && <SharePanel />}
          {schedule && <Notifications schedule={schedule} />}
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-6 grid md:grid-cols-2 gap-6">
        <CalendarView sharedToken={sharedToken} />
        <History refreshKey={refreshKey} sharedToken={sharedToken} />
      </div>
    </div>
  )
}

export default App
