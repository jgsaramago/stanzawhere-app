import { useMemo, useRef, useState } from 'react'
import { Mail, Plane, Upload, Users, X } from 'lucide-react'
import { looksLikeFlightCsv, parseFlightCsv } from '../lib/csvFlights'
import { toDateKey, uid } from '../lib/dates'
import { parseFlightEmail, readDroppedFile } from '../lib/flightEmail'
import type {
  FlightSegment,
  ParsedFlightEmail,
  Person,
  ScheduleEvent,
} from '../types'

type ImportMode = 'individual' | 'multiple'

function buildTripEvents(args: {
  person: Person
  currentUserId: string
  destination: string
  countryCode?: string
  startDate: string
  endDate: string
  flights: FlightSegment[]
  notesExtra?: string
}): ScheduleEvent[] {
  const now = new Date().toISOString()
  const notes = [args.notesExtra, 'Imported from flight confirmation']
    .filter(Boolean)
    .join(' · ')

  return [
    {
      id: uid('flt'),
      personId: args.person.id,
      type: 'travel',
      title: `Flight to ${args.destination}`,
      startDate: args.startDate,
      endDate: args.endDate,
      location: args.destination,
      countryCode: args.countryCode ?? args.person.homeCountry,
      notes,
      status: 'approved',
      requestedBy: args.currentUserId,
      approverId: null,
      reviewedBy: args.currentUserId,
      createdAt: now,
      updatedAt: now,
      flights: args.flights,
    },
    {
      id: uid('loc'),
      personId: args.person.id,
      type: 'location',
      title: `Week in ${args.destination}`,
      startDate: args.startDate,
      endDate: args.endDate,
      location: args.destination,
      countryCode: args.countryCode ?? args.person.homeCountry,
      notes: 'Auto-set from flight import',
      status: 'approved',
      requestedBy: args.currentUserId,
      approverId: null,
      reviewedBy: args.currentUserId,
      createdAt: now,
      updatedAt: now,
    },
  ]
}

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
  const roster = useMemo(
    () => [...people].sort((a, b) => a.name.localeCompare(b.name)),
    [people],
  )

  const [mode, setMode] = useState<ImportMode>('individual')
  const [personId, setPersonId] = useState(currentUser.id)
  const [selectedIds, setSelectedIds] = useState<string[]>([currentUser.id])
  const [dragging, setDragging] = useState(false)
  const [raw, setRaw] = useState('')
  const [parsed, setParsed] = useState<ParsedFlightEmail | null>(null)
  const [csvSummary, setCsvSummary] = useState<string | null>(null)
  const [pendingEvents, setPendingEvents] = useState<ScheduleEvent[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const subject = roster.find((p) => p.id === personId) ?? currentUser
  const selectedPeople = roster.filter((p) => selectedIds.includes(p.id))

  function togglePerson(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function eventsFromParsed(
    result: ParsedFlightEmail,
    travelers: Person[],
  ): ScheduleEvent[] {
    const startDate = result.startDate ?? toDateKey(new Date())
    const endDate = result.endDate ?? startDate
    const destination =
      result.destinationCity ||
      result.flights[result.flights.length - 1]?.toCity ||
      'Destination'
    const notesExtra = [
      result.airline ? `Airline: ${result.airline}` : null,
      result.confirmation ? `Confirmation: ${result.confirmation}` : null,
    ]
      .filter(Boolean)
      .join(' · ')

    return travelers.flatMap((person) =>
      buildTripEvents({
        person,
        currentUserId: currentUser.id,
        destination,
        countryCode: result.destinationCountry,
        startDate,
        endDate,
        flights: result.flights,
        notesExtra: notesExtra || undefined,
      }),
    )
  }

  function runParse(text: string) {
    setRaw(text)
    setPendingEvents(null)
    setCsvSummary(null)

    if (looksLikeFlightCsv(text)) {
      const { trips, unmatched } = parseFlightCsv(text, roster)
      if (!trips.length) {
        setParsed(null)
        setError(
          unmatched[0] ||
            'Couldn’t match CSV rows to people. Use columns: person, flight, date (YYYY-MM-DD), from, to.',
        )
        return
      }
      const events = trips.flatMap((trip) => {
        const person = roster.find((p) => p.id === trip.personId)
        if (!person || !trip.flights.length) return []
        const destination =
          trip.destinationCity ||
          trip.flights[0]?.toCity ||
          trip.flights[0]?.toCode ||
          'Destination'
        return buildTripEvents({
          person,
          currentUserId: currentUser.id,
          destination,
          countryCode: trip.destinationCountry,
          startDate: trip.startDate ?? trip.flights[0].date,
          endDate: trip.endDate ?? trip.flights[trip.flights.length - 1].date,
          flights: trip.flights,
          notesExtra: 'Imported from CSV roster',
        })
      })
      setParsed(null)
      setPendingEvents(events)
      setError(null)
      const tripCount = events.filter((e) => e.type === 'travel').length
      setCsvSummary(
        `Matched ${trips.length} traveler${trips.length === 1 ? '' : 's'} · ${tripCount} trip${tripCount === 1 ? '' : 's'}${
          unmatched.length ? ` · ${unmatched.length} unmatched row(s)` : ''
        }`,
      )
      setMode('multiple')
      setSelectedIds(trips.map((t) => t.personId))
      return
    }

    const result = parseFlightEmail(text)
    if (!result.flights.length) {
      setParsed(null)
      setError(
        'Couldn’t find flight numbers / airports. Paste a confirmation email, or a CSV with person + flight columns.',
      )
      return
    }
    setError(null)
    setParsed(result)
  }

  async function handleFiles(files: FileList | File[]) {
    const file = files[0]
    if (!file) return
    const name = file.name.toLowerCase()
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      setError(
        'Excel (.xlsx) isn’t supported yet — export as CSV (person, flight, date, from, to) and drop that file.',
      )
      return
    }
    try {
      const text = await readDroppedFile(file)
      runParse(text)
    } catch {
      setError('Could not read that file.')
    }
  }

  function confirmImport() {
    if (pendingEvents?.length) {
      onImport(pendingEvents)
      return
    }
    if (!parsed?.flights.length) return
    const travelers =
      mode === 'multiple'
        ? selectedPeople.length
          ? selectedPeople
          : [subject]
        : [subject]
    onImport(eventsFromParsed(parsed, travelers))
  }

  const canConfirm = Boolean(
    pendingEvents?.length ||
      (parsed?.flights.length &&
        (mode === 'individual' || selectedIds.length > 0)),
  )

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

        <div className="import-mode-toggle" role="group" aria-label="Traveler mode">
          <button
            type="button"
            className={mode === 'individual' ? 'active' : ''}
            onClick={() => setMode('individual')}
          >
            Individual ticket
          </button>
          <button
            type="button"
            className={mode === 'multiple' ? 'active' : ''}
            onClick={() => setMode('multiple')}
          >
            <Users size={14} />
            Multiple colleagues
          </button>
        </div>

        {mode === 'individual' ? (
          <label>
            Traveler
            <select value={personId} onChange={(e) => setPersonId(e.target.value)}>
              {roster.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.title} · {p.homeCity}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="traveler-multi">
            <div className="traveler-multi-head">
              <strong>Travelers</strong>
              <span className="muted">{selectedIds.length} selected</span>
              <button
                type="button"
                className="btn ghost tiny"
                onClick={() => setSelectedIds(roster.map((p) => p.id))}
              >
                Select all
              </button>
              <button
                type="button"
                className="btn ghost tiny"
                onClick={() => setSelectedIds([currentUser.id])}
              >
                Only me
              </button>
            </div>
            <div className="traveler-checklist">
              {roster.map((p) => (
                <label key={p.id} className="traveler-check">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(p.id)}
                    onChange={() => togglePerson(p.id)}
                  />
                  <span>
                    {p.name}
                    <em>
                      {p.title} · {p.homeCity}
                    </em>
                  </span>
                </label>
              ))}
            </div>
            <p className="muted tiny-hint">
              Same itinerary is applied to everyone selected. For different flights per
              person, upload a CSV roster instead.
            </p>
          </div>
        )}

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
          <strong>Drop flight email or CSV roster</strong>
          <span>
            .eml / .txt / .html for one ticket · .csv for many people (export Excel as CSV)
          </span>
          <input
            ref={inputRef}
            type="file"
            accept=".eml,.txt,.html,.htm,.csv,message/rfc822,text/plain,text/html,text/csv"
            hidden
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        <label className="block-label">
          Or paste email / CSV text
          <textarea
            rows={5}
            value={raw}
            placeholder="Paste confirmation email, or CSV with person, flight, date, from, to…"
            onChange={(e) => {
              setRaw(e.target.value)
              if (e.target.value.trim().length > 40) runParse(e.target.value)
            }}
          />
        </label>

        {error && <p className="import-error">{error}</p>}

        {csvSummary && (
          <div className="parse-preview">
            <div className="parse-top">
              <Users size={16} />
              <strong>CSV roster ready</strong>
            </div>
            <p className="muted">{csvSummary}</p>
          </div>
        )}

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
              {mode === 'multiple'
                ? ` · will add for ${selectedIds.length} traveler${selectedIds.length === 1 ? '' : 's'}`
                : ` · ${subject.name}`}
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
            disabled={!canConfirm}
            onClick={confirmImport}
          >
            Add to calendar
          </button>
        </footer>
      </div>
    </div>
  )
}
