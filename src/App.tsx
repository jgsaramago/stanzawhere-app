import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addWeeks,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isWeekend,
  startOfWeek,
} from 'date-fns'
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Plane,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sun,
  Undo2,
  Umbrella,
  X,
} from 'lucide-react'
import { FlightImportModal } from './components/FlightImportModal'
import { HelpChatbot } from './components/HelpChatbot'
import { DressCodeLegend, DressCodeMark } from './components/DressCodeMark'
import { ProfileModal } from './components/ProfileModal'
import { UserManualModal } from './components/UserManualModal'
import type { ChatAction } from './data/manual'
import { approverForPerson, COUNTRY_OPTIONS, COUNTRY_NAMES, HOLIDAYS, TIMEZONE_LANES } from './data/seed'
import {
  addMonths,
  colorForPlace,
  eventsForPersonDay,
  formatTzOffset,
  formatTzTime,
  getMonthWeeks,
  getWeekDays,
  holidaysForDay,
  placeForPersonDay,
  toDateKey,
  uid,
  weekLocationForPerson,
} from './lib/dates'
import { canEditAll, canEditPerson } from './lib/permissions'
import {
  deleteEvent,
  ensureFixedDemoEvents,
  HISTORY_LIMIT,
  loadHistory,
  loadState,
  recoverFlightSnapshot,
  resetDemoState,
  saveHistory,
  saveState,
  snapshot,
  upsertEvent,
  upsertPerson,
} from './lib/storage'
import type {
  ApprovalStatus,
  DressCode,
  EventType,
  FlightSegment,
  Person,
  ScheduleEvent,
} from './types'
import { DRESS_CODES } from './types'
import './App.css'

type Tab = 'calendar' | 'approvals'
type CalendarMode = 'week' | 'month'

function flightsForDay(event: ScheduleEvent, dayKey: string): FlightSegment[] {
  return (event.flights ?? []).filter((f) => f.date === dayKey)
}

const EVENT_META: Record<
  EventType,
  { label: string; icon: typeof Plane; className: string }
> = {
  travel: { label: 'Travel', icon: Plane, className: 'chip-travel' },
  pto: { label: 'PTO', icon: Umbrella, className: 'chip-pto' },
  location: { label: 'Location', icon: MapPin, className: 'chip-location' },
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
}

function Avatar({ person }: { person: Person }) {
  const [failed, setFailed] = useState(false)
  if (person.avatarUrl && !failed) {
    return (
      <img
        className="avatar"
        src={person.avatarUrl}
        alt={person.name}
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <div className="avatar" style={{ background: person.avatarColor }}>
      {initials(person.name)}
    </div>
  )
}

function StatusBadge({ status }: { status: ApprovalStatus }) {
  return <span className={`status status-${status}`}>{status}</span>
}

function EventForm({
  people,
  currentUser,
  onClose,
  onSubmit,
}: {
  people: Person[]
  currentUser: Person
  onClose: () => void
  onSubmit: (event: ScheduleEvent) => void
}) {
  const editablePeople = people.filter((p) =>
    canEditPerson(currentUser.id, p.id),
  )
  const [personId, setPersonId] = useState(
    () => editablePeople[0]?.id ?? currentUser.id,
  )
  const [type, setType] = useState<EventType>('travel')
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState(toDateKey(new Date()))
  const [endDate, setEndDate] = useState(toDateKey(new Date()))
  const [location, setLocation] = useState('')
  const [countryCode, setCountryCode] = useState(currentUser.homeCountry)
  const [notes, setNotes] = useState('')
  const [dressCode, setDressCode] = useState<DressCode | ''>('business-casual')
  const [asDraft, setAsDraft] = useState(false)

  const subject = people.find((p) => p.id === personId) ?? currentUser
  const approver = approverForPerson(subject)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const now = new Date().toISOString()
    const defaultTitle =
      type === 'pto'
        ? 'PTO'
        : type === 'location'
          ? `Week in ${location || subject.homeCity}`
          : `Travel to ${location || 'destination'}`

    const needsApproval = Boolean(subject.approverId)
    const status: ApprovalStatus = asDraft
      ? 'draft'
      : needsApproval
        ? 'pending'
        : 'approved'

    onSubmit({
      id: uid('evt'),
      personId,
      type,
      title: title.trim() || defaultTitle,
      startDate,
      endDate: endDate < startDate ? startDate : endDate,
      location: location.trim() || undefined,
      countryCode,
      notes: notes.trim() || undefined,
      dressCode: dressCode || undefined,
      status,
      requestedBy: currentUser.id,
      approverId: subject.approverId,
      reviewedBy: status === 'approved' ? currentUser.id : undefined,
      createdAt: now,
      updatedAt: now,
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal"
        onClick={(ev) => ev.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">New request</p>
            <h2>Add schedule item</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="form-grid">
          <label>
            Person
            <select value={personId} onChange={(e) => setPersonId(e.target.value)}>
              {editablePeople.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value as EventType)}>
              <option value="travel">Travel</option>
              <option value="pto">PTO</option>
              <option value="location">Week location</option>
            </select>
          </label>

          <label className="span-2">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Optional — auto-filled if blank"
            />
          </label>

          <label>
            Start
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </label>

          <label>
            End
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </label>

          <label>
            Location / city
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Lisbon, SF HQ…"
              required={type !== 'pto'}
            />
          </label>

          <label>
            Country (holidays)
            <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
              {COUNTRY_OPTIONS.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label className="span-2">
            Dress code
            <select
              value={dressCode}
              onChange={(e) => setDressCode(e.target.value as DressCode | '')}
            >
              <option value="">None / not specified</option>
              {DRESS_CODES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label} — {d.hint}
                </option>
              ))}
            </select>
          </label>

          <label className="span-2">
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Context for approvers"
            />
          </label>

          <p className="approver-hint span-2">
            {approver
              ? `Approver: ${approver.name} (${approver.title})`
              : 'No approval needed (CEO — auto-approved on submit)'}
          </p>

          <label className="checkbox span-2">
            <input
              type="checkbox"
              checked={asDraft}
              onChange={(e) => setAsDraft(e.target.checked)}
            />
            Save as draft (do not submit for approval yet)
          </label>
        </div>

        <footer className="modal-footer">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary">
            {asDraft
              ? 'Save draft'
              : approver
                ? 'Submit for approval'
                : 'Save (auto-approved)'}
          </button>
        </footer>
      </form>
    </div>
  )
}

export default function App() {
  const [state, setState] = useState(() => loadState())
  const [past, setPast] = useState<ReturnType<typeof loadHistory>>(() => loadHistory())
  const [future, setFuture] = useState<ReturnType<typeof loadHistory>>([])
  const [anchor, setAnchor] = useState(() => new Date())
  const [tab, setTab] = useState<Tab>('calendar')
  const [mode, setMode] = useState<CalendarMode>('week')
  const [showForm, setShowForm] = useState(false)
  const [showFlightImport, setShowFlightImport] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [profilePerson, setProfilePerson] = useState<Person | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [now] = useState(() => new Date())
  const stateRef = useRef(state)
  const pastRef = useRef(past)
  const futureRef = useRef(future)
  stateRef.current = state
  pastRef.current = past
  futureRef.current = future

  const weekDays = useMemo(() => getWeekDays(anchor), [anchor])
  const monthWeeks = useMemo(() => getMonthWeeks(anchor), [anchor])
  const weekLabel = `${format(weekDays[0], 'MMM d')} – ${format(weekDays[6], 'MMM d, yyyy')}`
  const monthLabel = format(anchor, 'MMMM yyyy')

  const currentUser =
    state.people.find((p) => p.id === state.currentUserId) ?? state.people[0]
  const isGlobalEditor = canEditAll(currentUser.id)

  function denyEdit(action = 'edit this') {
    showToast(`You can only ${action} on your own row — switch Acting as if needed`)
  }

  const teamCountries = useMemo(
    () => [...new Set(state.people.map((p) => p.homeCountry))],
    [state.people],
  )

  const weekHolidays = useMemo(
    () =>
      weekDays.flatMap((day) =>
        holidaysForDay(HOLIDAYS, day, teamCountries).map((h) => ({ ...h, day })),
      ),
    [weekDays, teamCountries],
  )

  const myQueue = state.events.filter(
    (e) => e.status === 'pending' && e.approverId === currentUser.id,
  )
  const allPending = state.events.filter((e) => e.status === 'pending')
  const recoverable = useMemo(() => recoverFlightSnapshot(past), [past])
  const hasImportedFlight = state.events.some(
    (e) => (e.flights?.length ?? 0) > 0 || e.notes?.includes('Imported from flight'),
  )

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(null), 2800)
  }

  function persist(next: typeof state, recordHistory = true) {
    if (recordHistory) {
      const nextPast = [...pastRef.current, snapshot(stateRef.current)].slice(
        -HISTORY_LIMIT,
      )
      setPast(nextPast)
      saveHistory(nextPast)
      setFuture([])
    }
    setState(next)
    saveState(next)
  }

  function undo() {
    const history = pastRef.current
    if (history.length === 0) {
      showToast('Nothing to undo')
      return
    }
    const previous = history[history.length - 1]
    const nextPast = history.slice(0, -1)
    setPast(nextPast)
    saveHistory(nextPast)
    setFuture((f) => [snapshot(stateRef.current), ...f].slice(0, HISTORY_LIMIT))
    setState(previous)
    saveState(previous)
    setSelectedEvent(null)
    showToast('Undid last change')
  }

  function redo() {
    const stack = futureRef.current
    if (stack.length === 0) {
      showToast('Nothing to redo')
      return
    }
    const nextState = stack[0]
    setFuture((f) => f.slice(1))
    const nextPast = [...pastRef.current, snapshot(stateRef.current)].slice(
      -HISTORY_LIMIT,
    )
    setPast(nextPast)
    saveHistory(nextPast)
    setState(nextState)
    saveState(nextState)
    setSelectedEvent(null)
    showToast('Redid change')
  }

  function restoreRecoveredFlight() {
    const snap = recoverFlightSnapshot(pastRef.current)
    if (!snap) {
      showToast('No previous flight found in history')
      return
    }
    persist(snap)
    showToast('Restored previous flight / calendar snapshot')
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      if (typing) return

      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      const key = e.key.toLowerCase()
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Keep fixed demo bookings (incl. dress codes) in sync with seed.
  useEffect(() => {
    setState((prev) => {
      const events = ensureFixedDemoEvents(prev.events)
      const changed =
        events.length !== prev.events.length ||
        events.some((e) => {
          const old = prev.events.find((x) => x.id === e.id)
          return !old || old.dressCode !== e.dressCode || old.location !== e.location
        })
      if (!changed) return prev
      const next = { ...prev, events }
      saveState(next)
      return next
    })
  }, [])

  function addEvent(event: ScheduleEvent) {
    if (!canEditPerson(currentUser.id, event.personId)) {
      denyEdit('add requests')
      return
    }
    const base = stateRef.current
    persist({ ...base, events: upsertEvent(base.events, event) })
    setShowForm(false)
    if (event.status === 'pending') setTab('approvals')
  }

  function addEvents(events: ScheduleEvent[]) {
    if (events.length === 0) return
    const allowed = events.filter((e) =>
      canEditPerson(currentUser.id, e.personId),
    )
    if (allowed.length === 0) {
      denyEdit('create requests')
      return
    }
    if (allowed.length < events.length) {
      showToast(
        `Created ${allowed.length} of ${events.length} — others were outside your edit rights`,
      )
    }
    const base = stateRef.current
    let next = base.events
    for (const event of allowed) next = upsertEvent(next, event)
    persist({ ...base, events: next })
    setShowForm(false)
    if (allowed.some((e) => e.status === 'pending')) setTab('approvals')
  }

  function importEvents(events: ScheduleEvent[]) {
    const allowed = events.filter((e) =>
      canEditPerson(currentUser.id, e.personId),
    )
    if (allowed.length === 0) {
      denyEdit('import flights')
      return
    }
    const base = stateRef.current
    let next = base.events
    for (const event of allowed) next = upsertEvent(next, event)
    persist({ ...base, events: next })
    setShowFlightImport(false)
    if (allowed.some((e) => e.status === 'pending')) setTab('approvals')
    showToast('Flight imported — Cmd+Z to undo')
  }

  function removeEvent(event: ScheduleEvent, { confirm = false } = {}) {
    if (!canEditPerson(currentUser.id, event.personId)) {
      denyEdit('delete events')
      return
    }
    const label = event.title || EVENT_META[event.type].label
    if (confirm && !window.confirm(`Delete “${label}” from the calendar?`)) return
    persist({
      ...state,
      events: deleteEvent(state.events, event.id),
    })
    setSelectedEvent(null)
    showToast(`Deleted “${label}” — press Cmd+Z to undo`)
  }

  function canReview(event: ScheduleEvent): boolean {
    return event.status === 'pending' && event.approverId === currentUser.id
  }

  function review(event: ScheduleEvent, status: 'approved' | 'rejected') {
    if (!canReview(event)) return
    const updated: ScheduleEvent = {
      ...event,
      status,
      reviewedBy: currentUser.id,
      reviewNote: reviewNote.trim() || undefined,
      updatedAt: new Date().toISOString(),
    }
    persist({ ...state, events: upsertEvent(state.events, updated) })
    setSelectedEvent(null)
    setReviewNote('')
  }

  function submitDraft(event: ScheduleEvent) {
    if (!canEditPerson(currentUser.id, event.personId)) {
      denyEdit('submit requests')
      return
    }
    const person = state.people.find((p) => p.id === event.personId)
    const approverId = person?.approverId ?? null
    const updated: ScheduleEvent = {
      ...event,
      status: approverId ? 'pending' : 'approved',
      approverId,
      reviewedBy: approverId ? undefined : currentUser.id,
      updatedAt: new Date().toISOString(),
    }
    persist({ ...state, events: upsertEvent(state.events, updated) })
  }

  function hardReset() {
    if (!isGlobalEditor) {
      denyEdit('reload the roster')
      return
    }
    if (
      !window.confirm(
        'Reload demo roster? Your current calendar will be saved to history (Cmd+Z / Restore flight).',
      )
    ) {
      return
    }
    persist(resetDemoState())
    setTab('calendar')
    setMode('week')
    setAnchor(new Date())
    showToast('Roster reloaded — Cmd+Z or Restore flight if needed')
  }

  function handleChatAction(action: ChatAction) {
    switch (action) {
      case 'open-manual':
        setShowManual(true)
        break
      case 'import-flight':
        setShowFlightImport(true)
        break
      case 'new-request':
        setShowForm(true)
        break
      case 'week-view':
        setTab('calendar')
        setMode('week')
        break
      case 'month-view':
        setTab('calendar')
        setMode('month')
        break
      case 'approvals':
        setTab('approvals')
        break
      case 'undo':
        undo()
        break
    }
  }

  return (
    <div className="app">
      {toast && <div className="toast">{toast}</div>}
      {!isGlobalEditor && (
        <div className="perm-banner">
          Acting as <strong>{currentUser.name}</strong> — you can edit your own row
          only. João, Vaidehi, and Erica can edit everyone.
        </div>
      )}
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden>
            <Sun size={18} />
          </div>
          <div>
            <h1>StanzaWhere</h1>
            <p>Team travel, PTO & weekly locations</p>
          </div>
        </div>

        <nav className="tabs" aria-label="Views">
          <button
            className={tab === 'calendar' ? 'active' : ''}
            onClick={() => setTab('calendar')}
          >
            Calendar
          </button>
          <button
            className={tab === 'approvals' ? 'active' : ''}
            onClick={() => setTab('approvals')}
          >
            Approvals
            {myQueue.length > 0 && <span className="count">{myQueue.length}</span>}
          </button>
        </nav>

        <div className="topbar-actions">
          <button
            className="icon-btn"
            onClick={() => setShowManual(true)}
            title="User manual"
            aria-label="User manual"
          >
            <BookOpen size={18} />
          </button>
          <button
            className="btn ghost"
            onClick={undo}
            disabled={past.length === 0}
            title="Undo (Cmd+Z)"
          >
            <Undo2 size={14} />
            Undo
          </button>
          {!hasImportedFlight && recoverable && (
            <button className="btn reset" onClick={restoreRecoveredFlight}>
              Restore flight
            </button>
          )}
          <button
            className="btn ghost"
            onClick={hardReset}
            disabled={!isGlobalEditor}
            title="Reload demo roster (kept in undo history)"
          >
            <RotateCcw size={14} />
            Reload roster
          </button>
          <label className="user-switch">
            Acting as
            <select
              value={currentUser.id}
              onChange={(e) => persist({ ...state, currentUserId: e.target.value })}
            >
              {state.people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.title}
                </option>
              ))}
            </select>
          </label>
          <button className="btn ghost" onClick={() => setShowFlightImport(true)}>
            <Mail size={16} />
            Import flight
          </button>
          <button className="btn primary" onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Request
          </button>
        </div>
      </header>

      {tab === 'calendar' && (
        <main className="calendar-view">
          <div className="toolbar">
            <div className="week-nav">
              <button
                className="icon-btn"
                onClick={() =>
                  setAnchor((d) => (mode === 'week' ? addWeeks(d, -1) : addMonths(d, -1)))
                }
                aria-label="Previous"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="week-meta">
                <strong>{mode === 'week' ? weekLabel : monthLabel}</strong>
                <span>
                  {mode === 'week'
                    ? `Week of ${format(startOfWeek(anchor, { weekStartsOn: 1 }), 'MMM d')}`
                    : 'Monthly summary'}
                </span>
              </div>
              <button
                className="icon-btn"
                onClick={() =>
                  setAnchor((d) => (mode === 'week' ? addWeeks(d, 1) : addMonths(d, 1)))
                }
                aria-label="Next"
              >
                <ChevronRight size={18} />
              </button>
              <button className="btn ghost" onClick={() => setAnchor(new Date())}>
                Today
              </button>
            </div>

            <div className="mode-toggle" role="group" aria-label="Calendar mode">
              <button
                className={mode === 'week' ? 'active' : ''}
                onClick={() => setMode('week')}
              >
                Week
              </button>
              <button
                className={mode === 'month' ? 'active' : ''}
                onClick={() => setMode('month')}
              >
                Month
              </button>
            </div>

            <div className="legend">
              <span className="chip chip-travel">Travel</span>
              <span className="chip chip-pto">PTO</span>
              <span className="chip chip-location">Location</span>
              <span className="chip chip-remote">Remote</span>
              <span className="chip chip-weekend">Weekend</span>
              <span className="chip chip-holiday">Holiday</span>
              <span className="chip chip-pending">Pending</span>
            </div>
          </div>

          <DressCodeLegend />

          {mode === 'week' && (
            <>
              {weekHolidays.length > 0 && (
                <div className="holiday-strip">
                  <ShieldCheck size={16} />
                  <div>
                    {weekHolidays.map((h) => (
                      <span key={`${h.countryCode}-${h.date}-${h.name}`}>
                        <strong>{format(h.day, 'EEE')}</strong> · {h.name} (
                        {COUNTRY_NAMES[h.countryCode] ?? h.countryCode})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid-wrap">
                <div
                  className="schedule-grid"
                  style={{
                    gridTemplateColumns: `260px repeat(${weekDays.length}, minmax(140px, 1fr))`,
                  }}
                >
                  <div className="corner cell">
                    <span className="corner-title">People</span>
                    <div className="tz-stack">
                      {TIMEZONE_LANES.map((lane) => (
                        <div key={lane.id} className="tz-lane">
                          <strong>{lane.label}</strong>
                          <span>
                            {lane.city} · {formatTzOffset(now, lane.timezone)}
                          </span>
                          <em>{formatTzTime(now, lane.timezone)}</em>
                        </div>
                      ))}
                    </div>
                  </div>

                  {weekDays.map((day) => {
                    const dayHolidays = holidaysForDay(HOLIDAYS, day, teamCountries)
                    return (
                      <div
                        key={day.toISOString()}
                        className={`day-head cell day-head-compact ${isToday(day) ? 'is-today' : ''} ${
                          isWeekend(day) ? 'is-weekend' : ''
                        } ${dayHolidays.length ? 'has-holiday' : ''}`}
                      >
                        <div className="day-label">
                          <strong>{format(day, 'EEE')}</strong>
                          <span>{format(day, 'MMM d')}</span>
                        </div>
                        {dayHolidays.length > 0 && (
                          <div className="day-holidays">
                            {dayHolidays.map((h) => (
                              <span key={`${h.countryCode}-${h.name}`}>
                                {h.countryCode}: {h.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {state.people.map((person) => {
                    const location = weekLocationForPerson(
                      state.events,
                      person.id,
                      weekDays,
                    )
                    return (
                      <div className="person-row" key={person.id}>
                        <button
                          type="button"
                          className="person-cell cell person-profile-btn"
                          onClick={() => setProfilePerson(person)}
                          title={
                            canEditPerson(currentUser.id, person.id)
                              ? `Edit ${person.name}'s profile`
                              : `View ${person.name}'s profile`
                          }
                        >
                          <Avatar person={person} />
                          <div className="person-meta">
                            <strong>{person.name}</strong>
                            <span>
                              {person.title} · {person.homeCity}
                            </span>
                            <span className="tz-home">
                              Home TZ: {formatTzTime(now, person.timezone)} (
                              {formatTzOffset(now, person.timezone)})
                            </span>
                            {location && (
                              <span className="week-loc">
                                <MapPin size={12} /> This week: {location}
                              </span>
                            )}
                          </div>
                        </button>

                        {weekDays.map((day) => {
                          const dayEvents = eventsForPersonDay(
                            state.events,
                            person.id,
                            day,
                          )
                          const localHoliday = holidaysForDay(HOLIDAYS, day, [
                            person.homeCountry,
                          ])
                          return (
                            <div
                              key={`${person.id}-${day.toISOString()}`}
                              className={`day-cell cell ${
                                isToday(day) ? 'is-today' : ''
                              } ${isWeekend(day) ? 'is-weekend' : ''} ${
                                localHoliday.length ? 'has-holiday' : ''
                              }`}
                            >
                              {localHoliday.length > 0 && (
                                <div className="holiday-tag" title={localHoliday[0].name}>
                                  {localHoliday[0].name}
                                </div>
                              )}
                              <div className="event-stack">
                                {dayEvents.map((event) => {
                                  const meta = EVENT_META[event.type]
                                  const Icon = meta.icon
                                  const dayKey = toDateKey(day)
                                  const dayFlights = flightsForDay(event, dayKey)
                                  const isStart = isSameDay(
                                    day,
                                    new Date(`${event.startDate}T12:00:00`),
                                  )
                                  const dress =
                                    event.type !== 'pto' && event.dressCode
                                      ? DRESS_CODES.find((d) => d.id === event.dressCode)
                                      : undefined
                                  return (
                                    <div
                                      key={event.id}
                                      className={`event-block ${dress ? 'has-dress-mark' : ''}`}
                                    >
                                      {dress && (
                                        <DressCodeMark id={dress.id} />
                                      )}
                                      <button
                                        type="button"
                                        className={`event-chip ${meta.className} status-${event.status}`}
                                        onClick={() => setSelectedEvent(event)}
                                        onDoubleClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          removeEvent(event)
                                        }}
                                        title={`${event.title} (${event.status})${
                                          canEditPerson(currentUser.id, event.personId)
                                            ? ' — double-click to delete'
                                            : ''
                                        }`}
                                      >
                                        <Icon size={12} />
                                        <span>
                                          {isStart
                                            ? event.title
                                            : event.location || meta.label}
                                        </span>
                                      </button>
                                      {dayFlights.map((f) => (
                                        <div
                                          key={`${f.flightNumber}-${f.role}-${f.departTime ?? ''}`}
                                          className="flight-detail"
                                          title={`${f.flightNumber} ${f.fromCode ?? ''}→${f.toCode ?? ''}`}
                                        >
                                          <Plane size={11} />
                                          <span>
                                            {f.flightNumber}
                                            {f.role === 'departure' && f.departTime
                                              ? ` dep ${f.departTime}`
                                              : ''}
                                            {f.role === 'arrival' && f.arriveTime
                                              ? ` arr ${f.arriveTime}`
                                              : ''}
                                            {f.role === 'connection' && f.departTime
                                              ? ` ${f.departTime}`
                                              : ''}
                                            {f.fromCode || f.toCode
                                              ? ` · ${f.fromCode ?? '?'}→${f.toCode ?? '?'}`
                                              : ''}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )
                                })}
                                {dayEvents.length === 0 && !isWeekend(day) && (
                                  <div className="event-chip chip-remote remote-default">
                                    Remote
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {mode === 'month' && (
            <div className="month-view">
              {(() => {
                const placeLegend = new Map<string, string>()
                for (const person of state.people) {
                  for (const week of monthWeeks) {
                    for (const day of week) {
                      if (!isSameMonth(day, anchor)) continue
                      const info = placeForPersonDay(state.events, person, day)
                      if (!placeLegend.has(info.place)) {
                        placeLegend.set(
                          info.place,
                          colorForPlace(info.place, info.kind),
                        )
                      }
                    }
                  }
                }

                return (
                  <>
                    <div className="place-legend">
                      {[...placeLegend.entries()].map(([place, color]) => (
                        <span key={place} className="place-legend-item">
                          <i style={{ background: color }} />
                          {place}
                        </span>
                      ))}
                      <span className="place-legend-item muted-legend">
                        Dashed = pending approval
                      </span>
                    </div>

                    <div className="grid-wrap">
                      <div
                        className="month-color-grid"
                        style={{
                          gridTemplateColumns: `200px repeat(7, minmax(40px, 1fr))`,
                        }}
                      >
                        <div className="month-corner cell sticky-left">Person</div>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                          <div key={d} className="month-dow cell">
                            {d}
                          </div>
                        ))}

                        {monthWeeks.map((week) => (
                          <div key={week[0].toISOString()} className="month-week-section">
                            <div className="month-week-banner cell sticky-left">
                              Week of {format(week[0], 'MMM d')}
                            </div>
                            {week.map((day) => (
                              <div
                                key={day.toISOString()}
                                className={`month-day-num cell ${
                                  isSameMonth(day, anchor) ? '' : 'out-month'
                                } ${isToday(day) ? 'is-today' : ''} ${
                                  isWeekend(day) ? 'is-weekend' : ''
                                } ${
                                  holidaysForDay(HOLIDAYS, day, teamCountries).length
                                    ? 'has-holiday'
                                    : ''
                                }`}
                              >
                                {isSameMonth(day, anchor) ? format(day, 'd') : ''}
                              </div>
                            ))}

                            {state.people.map((person) => (
                              <div
                                className="person-row"
                                key={`${week[0].toISOString()}-${person.id}`}
                              >
                                <button
                                  type="button"
                                  className="person-cell month-person cell sticky-left person-profile-btn"
                                  onClick={() => setProfilePerson(person)}
                                  title={`Edit ${person.name}'s profile`}
                                >
                                  <Avatar person={person} />
                                  <div className="person-meta">
                                    <strong>{person.name.split(' ')[0]}</strong>
                                    <span>{person.title}</span>
                                  </div>
                                </button>
                                {week.map((day) => {
                                  if (!isSameMonth(day, anchor)) {
                                    return (
                                      <div
                                        key={day.toISOString()}
                                        className={`month-swatch cell out-month ${
                                          isWeekend(day) ? 'is-weekend' : ''
                                        }`}
                                      />
                                    )
                                  }
                                  const info = placeForPersonDay(
                                    state.events,
                                    person,
                                    day,
                                  )
                                  const color = colorForPlace(info.place, info.kind)
                                  const localHoliday = holidaysForDay(HOLIDAYS, day, [
                                    person.homeCountry,
                                  ])
                                  return (
                                    <button
                                      key={day.toISOString()}
                                      type="button"
                                      className={`month-swatch cell ${
                                        info.pending ? 'pending-swatch' : ''
                                      } ${isToday(day) ? 'is-today' : ''} ${
                                        isWeekend(day) ? 'is-weekend' : ''
                                      } ${localHoliday.length ? 'has-holiday' : ''}`}
                                      style={{ backgroundColor: color }}
                                      title={`${person.name} · ${format(day, 'MMM d')} · ${info.place}${
                                        info.pending ? ' (pending)' : ''
                                      }${
                                        localHoliday.length
                                          ? ` · ${localHoliday[0].name}`
                                          : ''
                                      }`}
                                      onClick={() => {
                                        setAnchor(day)
                                        setMode('week')
                                      }}
                                    />
                                  )
                                })}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </main>
      )}

      {tab === 'approvals' && (
        <main className="approvals-view">
          <div className="approvals-header">
            <div>
              <p className="eyebrow">Workflow</p>
              <h2>Approval queue</h2>
              <p className="muted">
                Darwin → Nick · Charlie / Anirban / João → Darwin · everyone else → Charlie
              </p>
            </div>
            <div className="banner">
              Acting as <strong>{currentUser.name}</strong>. You have{' '}
              <strong>{myQueue.length}</strong> item{myQueue.length === 1 ? '' : 's'} to
              review.
            </div>
          </div>

          <div className="approval-columns">
            <section>
              <h3>Needs your approval ({myQueue.length})</h3>
              <div className="card-list">
                {myQueue.length === 0 && (
                  <p className="empty">Nothing waiting for you right now.</p>
                )}
                {myQueue.map((event) => {
                  const person = state.people.find((p) => p.id === event.personId)
                  const meta = EVENT_META[event.type]
                  return (
                    <article key={event.id} className="request-card">
                      <div className="request-top">
                        <span className={`chip ${meta.className}`}>{meta.label}</span>
                        <StatusBadge status={event.status} />
                      </div>
                      <h4>{event.title}</h4>
                      <p>
                        {person?.name} · {event.startDate} → {event.endDate}
                      </p>
                      {event.location && (
                        <p className="muted">
                          <MapPin size={14} /> {event.location}
                        </p>
                      )}
                      {event.notes && <p className="notes">{event.notes}</p>}
                      <div className="request-actions">
                        <button
                          className="btn danger"
                          onClick={() => {
                            setSelectedEvent(event)
                            setReviewNote('')
                          }}
                        >
                          Review
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>

              {allPending.length > myQueue.length && (
                <div className="other-pending">
                  <h4>Other pending (not yours)</h4>
                  <ul>
                    {allPending
                      .filter((e) => e.approverId !== currentUser.id)
                      .map((e) => {
                        const person = state.people.find((p) => p.id === e.personId)
                        const approver = state.people.find((p) => p.id === e.approverId)
                        return (
                          <li key={e.id}>
                            {person?.name}: {e.title} → waiting on {approver?.name}
                          </li>
                        )
                      })}
                  </ul>
                </div>
              )}
            </section>

            <section>
              <h3>My drafts & history</h3>
              <div className="card-list">
                {state.events
                  .filter(
                    (e) =>
                      e.requestedBy === currentUser.id || e.personId === currentUser.id,
                  )
                  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                  .map((event) => {
                    const meta = EVENT_META[event.type]
                    const approver = state.people.find((p) => p.id === event.approverId)
                    return (
                      <article key={event.id} className="request-card compact">
                        <div className="request-top">
                          <span className={`chip ${meta.className}`}>{meta.label}</span>
                          <StatusBadge status={event.status} />
                        </div>
                        <h4>{event.title}</h4>
                        <p>
                          {event.startDate} → {event.endDate}
                          {event.location ? ` · ${event.location}` : ''}
                        </p>
                        {approver && event.status === 'pending' && (
                          <p className="muted">Waiting on {approver.name}</p>
                        )}
                        {event.status === 'draft' && (
                          <button
                            className="btn primary"
                            onClick={() => submitDraft(event)}
                          >
                            Submit for approval
                          </button>
                        )}
                        {event.reviewNote && (
                          <p className="notes">Reviewer: {event.reviewNote}</p>
                        )}
                      </article>
                    )
                  })}
              </div>
            </section>
          </div>
        </main>
      )}

      {showForm && (
        <EventForm
          people={state.people}
          currentUser={currentUser}
          onClose={() => setShowForm(false)}
          onSubmit={addEvent}
        />
      )}

      {showFlightImport && (
        <FlightImportModal
          people={state.people}
          currentUser={currentUser}
          onClose={() => setShowFlightImport(false)}
          onImport={importEvents}
        />
      )}

      {showManual && <UserManualModal onClose={() => setShowManual(false)} />}

      {profilePerson && (
        <ProfileModal
          person={profilePerson}
          readOnly={!canEditPerson(currentUser.id, profilePerson.id)}
          onClose={() => setProfilePerson(null)}
          onSave={(person) => {
            if (!canEditPerson(currentUser.id, person.id)) {
              denyEdit('edit profiles')
              return
            }
            persist({
              ...state,
              people: upsertPerson(state.people, person),
            })
            setProfilePerson(null)
            showToast(`Saved ${person.name}'s profile`)
          }}
        />
      )}

      <HelpChatbot
        onAction={handleChatAction}
        people={state.people}
        currentUser={currentUser}
        onCreateEvents={addEvents}
      />

      {selectedEvent && (
        <div className="modal-backdrop" onClick={() => setSelectedEvent(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <div>
                <p className="eyebrow">{EVENT_META[selectedEvent.type].label}</p>
                <h2>{selectedEvent.title}</h2>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </header>

            <div className="detail-grid">
              <p>
                <strong>Person</strong>
                <span>
                  {state.people.find((p) => p.id === selectedEvent.personId)?.name}
                </span>
              </p>
              <p>
                <strong>Status</strong>
                <StatusBadge status={selectedEvent.status} />
              </p>
              <p>
                <strong>Dates</strong>
                <span>
                  {selectedEvent.startDate} → {selectedEvent.endDate}
                </span>
              </p>
              <p>
                <strong>Approver</strong>
                <span>
                  {state.people.find((p) => p.id === selectedEvent.approverId)?.name ||
                    'Auto (CEO)'}
                </span>
              </p>
              <p>
                <strong>Location</strong>
                <span>{selectedEvent.location || '—'}</span>
              </p>
              <p>
                <strong>Dress code</strong>
                <span>
                  {selectedEvent.dressCode
                    ? (() => {
                        const d = DRESS_CODES.find((x) => x.id === selectedEvent.dressCode)
                        return d ? `${d.label} — ${d.hint}` : selectedEvent.dressCode
                      })()
                    : '—'}
                </span>
              </p>
              {selectedEvent.notes && (
                <p className="span-2">
                  <strong>Notes</strong>
                  <span>{selectedEvent.notes}</span>
                </p>
              )}
              {selectedEvent.flights && selectedEvent.flights.length > 0 && (
                <div className="span-2 flight-list">
                  <strong>Flights</strong>
                  <ul>
                    {selectedEvent.flights.map((f, i) => (
                      <li key={`${f.flightNumber}-${i}`}>
                        {f.date} · <b>{f.flightNumber}</b>
                        {f.fromCode || f.toCode
                          ? ` · ${f.fromCode ?? '?'}→${f.toCode ?? '?'}`
                          : ''}
                        {f.departTime ? ` · dep ${f.departTime}` : ''}
                        {f.arriveTime ? ` · arr ${f.arriveTime}` : ''}
                        {` · ${f.role}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {canReview(selectedEvent) && (
              <label className="block-label">
                Review note
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={3}
                  placeholder="Optional message to requester"
                />
              </label>
            )}

            <footer className="modal-footer between">
              {canEditPerson(currentUser.id, selectedEvent.personId) && (
                <button
                  type="button"
                  className="btn danger"
                  onClick={() => removeEvent(selectedEvent)}
                >
                  Delete
                </button>
              )}
              <div className="modal-footer-right">
                {canReview(selectedEvent) ? (
                  <>
                    <button
                      className="btn ghost"
                      onClick={() => review(selectedEvent, 'rejected')}
                    >
                      <X size={16} /> Reject
                    </button>
                    <button
                      className="btn primary"
                      onClick={() => review(selectedEvent, 'approved')}
                    >
                      <Check size={16} /> Approve
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => setSelectedEvent(null)}
                  >
                    Close
                  </button>
                )}
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
