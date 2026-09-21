import { useRef, useState } from 'react'
import { Mail, Plane, Upload, X } from 'lucide-react'
import { parseFlightEmail, readDroppedFile } from '../lib/flightEmail'
import { toDateKey, uid } from '../lib/dates'
import { canEditPerson } from '../lib/permissions'
import type { ParsedFlightEmail, Person, ScheduleEvent } from '../types'

export function FlightImportModal({
  people,
  currentUser,
  onClose,
  onImport,
}: {
  people: Person[]
  currentUser: Person
  onClose: () => void
  onImport: (events: ScheduleEvent[]) => void
}) {
  const editablePeople = people.filter((p) =>
    canEditPerson(currentUser.id, p.id),
  )
  const [personId, setPersonId] = useState(() => {
    if (editablePeople.some((p) => p.id === currentUser.id)) return currentUser.id
    return editablePeople[0]?.id ?? currentUser.id
  })
  const [dragging, setDragging] = useState(false)
  const [raw, setRaw] = useState('')
  const [parsed, setParsed] = useState<ParsedFlightEmail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const subject = people.find((p) => p.id === personId) ?? currentUser

  function runParse(text: string) {
    setRaw(text)
    const result = parseFlightEmail(text)
    if (!result.flights.length) {
      setParsed(null)
      setError(
        'Couldn’t find flight numbers / airports. Paste the full confirmation or try another airline email.',
      )
      return
    }
    setError(null)
    setParsed(result)
  }

  async function handleFiles(files: FileList | File[]) {
    const file = files[0]
    if (!file) return
    try {
      const text = await readDroppedFile(file)
      runParse(text)
    } catch {
      setError('Could not read that file.')
    }
  }

  function confirmImport() {
    if (!parsed?.flights.length) return
    const now = new Date().toISOString()
    const startDate = parsed.startDate ?? toDateKey(new Date())
    const endDate = parsed.endDate ?? startDate
    const destination =
      parsed.destinationCity ||
      parsed.flights[parsed.flights.length - 1]?.toCity ||
      'Destination'
    const status = 'approved' as const

    const notes = [
      parsed.airline ? `Airline: ${parsed.airline}` : null,
      parsed.confirmation ? `Confirmation: ${parsed.confirmation}` : null,
      'Imported from flight confirmation email',
    ]
      .filter(Boolean)
      .join(' · ')

    const travel: ScheduleEvent = {
      id: uid('flt'),
      personId: subject.id,
      type: 'travel',
      title: `Flight to ${destination}`,
      startDate,
      endDate,
      location: destination,
      countryCode: parsed.destinationCountry ?? subject.homeCountry,
      notes,
      status,
      requestedBy: currentUser.id,
      approverId: null,
      reviewedBy: currentUser.id,
      createdAt: now,
      updatedAt: now,
      flights: parsed.flights,
    }

    const locationEvent: ScheduleEvent = {
      id: uid('loc'),
      personId: subject.id,
      type: 'location',
      title: `Week in ${destination}`,
      startDate,
      endDate,
      location: destination,
      countryCode: parsed.destinationCountry ?? subject.homeCountry,
      notes: 'Auto-set from flight import',
      status,
      requestedBy: currentUser.id,
      approverId: null,
      reviewedBy: currentUser.id,
      createdAt: now,
      updatedAt: now,
    }

    onImport([travel, locationEvent])
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal flight-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <p className="eyebrow">Import</p>
            <h2>Flight confirmation</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <label>
          Traveler
          <select value={personId} onChange={(e) => setPersonId(e.target.value)}>
            {editablePeople.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.homeCity}
              </option>
            ))}
          </select>
        </label>

        <div
          className={`dropzone ${dragging ? 'dragging' : ''}`}
          onDragEnter={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
          }}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={22} />
          <strong>Drop flight confirmation email</strong>
          <span>.eml, .txt, or .html — or click to browse</span>
          <input
            ref={inputRef}
            type="file"
            accept=".eml,.txt,.html,.htm,message/rfc822,text/plain,text/html"
            hidden
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        <label className="block-label">
          Or paste email text
          <textarea
            rows={5}
            value={raw}
            placeholder="Paste confirmation email body here…"
            onChange={(e) => {
              setRaw(e.target.value)
              if (e.target.value.trim().length > 40) runParse(e.target.value)
            }}
          />
        </label>

        {error && <p className="import-error">{error}</p>}

        {parsed && (
          <div className="parse-preview">
            <div className="parse-top">
              <Plane size={16} />
              <strong>
                {parsed.destinationCity
                  ? `Trip to ${parsed.destinationCity}`
                  : 'Parsed itinerary'}
              </strong>
              {parsed.confirmation && <span>PNR {parsed.confirmation}</span>}
            </div>
            <p className="muted">
              {parsed.startDate} → {parsed.endDate}
            </p>
            <ul>
              {parsed.flights.map((f, i) => (
                <li key={`${f.flightNumber}-${i}`}>
                  <Mail size={14} />
                  <span>
                    <strong>{f.flightNumber}</strong> · {f.date}
                    {f.fromCode || f.toCode
                      ? ` · ${f.fromCode ?? '?'}→${f.toCode ?? '?'}`
                      : ''}
                    {f.departTime ? ` · dep ${f.departTime}` : ''}
                    {f.arriveTime ? ` · arr ${f.arriveTime}` : ''}
                    {` · ${f.role}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <footer className="modal-footer">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={!parsed?.flights.length}
            onClick={confirmImport}
          >
            Add to calendar
          </button>
        </footer>
      </div>
    </div>
  )
}
