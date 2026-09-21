import {
  buildFixedDemoEvents,
  buildSeedEvents,
  isObsoleteDemoEventId,
  PEOPLE,
} from '../data/seed'
import type { AppState, Person, ScheduleEvent } from '../types'

/** Bump when storage shape changes */
const STORAGE_KEY = 'stanza-where-v11'
/** Prior state keys to migrate from (not wiped until successfully read). */
const MIGRATE_FROM_KEYS = ['stanza-where-v10', 'stanza-where-v9', 'stanza-where-v8', 'stanza-where-v7', 'stanza-where-v6']
const HISTORY_KEY = 'stanza-where-history-v1'
const CHATBOT_POS_KEY = 'stanza-where-stanbot-pos'
const LEGACY_KEYS = [
  'stanza-where-v1',
  'stanza-where-v2',
  'stanza-where-v3',
  'stanza-where-v4',
  'stanza-where-v5',
]

/**
 * Ensure Heidelberg week demos exist in saved calendars.
 * Drops obsolete Dallas/Chicago/NYC demos and upserts by stable demo_* ids.
 */
/** Prior this-week onsite seeds for Nick / Anirban / Vaidehi — clear so cells default to Remote. */
const THIS_WEEK_REMOTE_CLEAR_IDS = new Set(['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8'])

export function ensureFixedDemoEvents(events: ScheduleEvent[]): ScheduleEvent[] {
  const demos = buildFixedDemoEvents()
  let next = events.filter(
    (e) => !isObsoleteDemoEventId(e.id) && !THIS_WEEK_REMOTE_CLEAR_IDS.has(e.id),
  )
  for (const demo of demos) {
    const idx = next.findIndex((e) => e.id === demo.id)
    if (idx === -1) next = [...next, demo]
    else next[idx] = { ...demo, createdAt: next[idx].createdAt }
  }
  return next
}

const HISTORY_LIMIT = 40

/**
 * Stale roster homes replaced by seed. If saved home still matches a superseded
 * value, prefer the canonical seed city/timezone so localStorage doesn't stick
 * old NY/DC data after roster corrections.
 */
const SUPERSEDED_HOMES: Record<string, string[]> = {
  greg: ['New York', 'NYC', 'New York City'],
  andrew: ['Washington DC', 'Washington D.C.', 'Washington', 'Washington, DC'],
}

function pickHomeFields(seed: Person, prev: Person) {
  const savedCity = prev.homeCity?.trim() ?? ''
  const superseded = SUPERSEDED_HOMES[seed.id] ?? []
  const useSeedHome =
    !savedCity ||
    savedCity === seed.homeCity ||
    superseded.some((c) => c.toLowerCase() === savedCity.toLowerCase())

  if (useSeedHome) {
    return {
      homeCity: seed.homeCity,
      homeCountry: seed.homeCountry,
      timezone: seed.timezone,
    }
  }

  return {
    homeCity: savedCity,
    homeCountry: prev.homeCountry?.trim() || seed.homeCountry,
    timezone: prev.timezone?.trim() || seed.timezone,
  }
}

function clearLegacy(): void {
  for (const key of LEGACY_KEYS) localStorage.removeItem(key)
}

/** Merge saved profile edits onto the canonical roster (keeps org approval rules). */
export function mergePeople(saved?: Person[]): Person[] {
  return PEOPLE.map((seed) => {
    const prev = saved?.find((p) => p.id === seed.id)
    if (!prev) return { ...seed }
    const home = pickHomeFields(seed, prev)
    return {
      ...seed,
      name: prev.name?.trim() || seed.name,
      email: prev.email?.trim() || seed.email,
      title: prev.title?.trim() || seed.title,
      ...home,
      avatarColor: prev.avatarColor || seed.avatarColor,
      avatarUrl: prev.avatarUrl || seed.avatarUrl,
      bio: prev.bio,
      phone: prev.phone,
      slack: prev.slack,
      workingHours: prev.workingHours,
      role: seed.role,
      approverId: seed.approverId,
    }
  })
}

function snapshot(state: AppState): AppState {
  return {
    people: structuredClone(state.people),
    events: structuredClone(state.events),
    teamEvents: structuredClone(state.teamEvents ?? []),
    currentUserId: state.currentUserId,
  }
}

export function loadHistory(): AppState[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as AppState[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((s) => Array.isArray(s?.events))
      .map((s) => ({
        people: mergePeople(s.people),
        events: s.events,
        teamEvents: Array.isArray(s.teamEvents) ? s.teamEvents : [],
        currentUserId: PEOPLE.some((p) => p.id === s.currentUserId)
          ? s.currentUserId
          : 'joao',
      }))
  } catch {
    return []
  }
}

export function saveHistory(history: AppState[]): void {
  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(history.slice(-HISTORY_LIMIT).map(snapshot)),
  )
}

export function recoverFlightSnapshot(history: AppState[]): AppState | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const hit = history[i]
    if (
      hit.events.some(
        (e) =>
          (e.flights?.length ?? 0) > 0 ||
          e.notes?.includes('Imported from flight') ||
          e.id.startsWith('flt_'),
      )
    ) {
      return snapshot({
        ...hit,
        people: mergePeople(hit.people),
      })
    }
  }
  for (let i = history.length - 1; i >= 0; i--) {
    if (hitHasTravel(history[i])) {
      return snapshot({
        ...history[i],
        people: mergePeople(history[i].people),
      })
    }
  }
  return null
}

function hitHasTravel(state: AppState): boolean {
  return state.events.some((e) => e.type === 'travel' && (e.flights?.length ?? 0) > 0)
}

function normalizeLoaded(parsed: AppState): AppState | null {
  if (!Array.isArray(parsed?.events)) return null
  const people = mergePeople(parsed.people)
  const rosterIds = new Set(people.map((p) => p.id))
  const events = ensureFixedDemoEvents(
    parsed.events.filter((e) => rosterIds.has(e.personId)),
  )
  return {
    people,
    events,
    teamEvents: Array.isArray(parsed.teamEvents) ? parsed.teamEvents : [],
    currentUserId: rosterIds.has(parsed.currentUserId)
      ? parsed.currentUserId
      : 'joao',
  }
}

function readStoredState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      return normalizeLoaded(parsed)
    }
  } catch {
    /* ignore */
  }

  for (const key of MIGRATE_FROM_KEYS) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as AppState
      const migrated = normalizeLoaded(parsed)
      if (migrated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
        localStorage.removeItem(key)
        return migrated
      }
    } catch {
      /* ignore */
    }
  }
  return null
}

export function loadState(): AppState {
  clearLegacy()

  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    if (params.get('reset') === '1') {
      localStorage.removeItem(STORAGE_KEY)
      for (const key of MIGRATE_FROM_KEYS) localStorage.removeItem(key)
      params.delete('reset')
      const next = params.toString()
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}${next ? `?${next}` : ''}`,
      )
      return {
        people: mergePeople(),
        events: buildSeedEvents(),
    teamEvents: [],
        currentUserId: 'joao',
      }
    }
  }

  const loaded = readStoredState()
  if (loaded) {
    // Persist merged demos so the next load stays in sync on v8.
    saveState(loaded)
    return loaded
  }

  const history = loadHistory()
  const recovered = recoverFlightSnapshot(history)
  if (recovered) {
    const recoveredState: AppState = {
      ...recovered,
      people: mergePeople(recovered.people),
      events: ensureFixedDemoEvents(recovered.events),
      teamEvents: Array.isArray(recovered.teamEvents) ? recovered.teamEvents : [],
    }
    saveState(recoveredState)
    return recoveredState
  }

  const fresh: AppState = {
    people: mergePeople(),
    events: buildSeedEvents(),
    teamEvents: [],
    currentUserId: 'joao',
  }
  saveState(fresh)
  return fresh
}

export function saveState(state: AppState): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...state,
      people: mergePeople(state.people),
    }),
  )
}

export function upsertEvent(
  events: ScheduleEvent[],
  event: ScheduleEvent,
): ScheduleEvent[] {
  const idx = events.findIndex((e) => e.id === event.id)
  if (idx === -1) return [...events, event]
  const next = [...events]
  next[idx] = event
  return next
}

export function deleteEvent(
  events: ScheduleEvent[],
  eventId: string,
): ScheduleEvent[] {
  return events.filter((e) => e.id !== eventId)
}

export function upsertPerson(people: Person[], person: Person): Person[] {
  return mergePeople(people.map((p) => (p.id === person.id ? person : p)))
}

export function resetDemoState(): AppState {
  clearLegacy()
  localStorage.removeItem(STORAGE_KEY)
  for (const key of MIGRATE_FROM_KEYS) localStorage.removeItem(key)
  const state: AppState = {
    people: mergePeople(),
    events: buildSeedEvents(),
    teamEvents: [],
    currentUserId: 'joao',
  }
  saveState(state)
  return state
}

export type ChatbotPos = { x: number; y: number }

export function loadChatbotPos(): ChatbotPos | null {
  try {
    const raw = localStorage.getItem(CHATBOT_POS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ChatbotPos
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') return parsed
  } catch {
    /* ignore */
  }
  return null
}

export function saveChatbotPos(pos: ChatbotPos): void {
  localStorage.setItem(CHATBOT_POS_KEY, JSON.stringify(pos))
}

export { snapshot, HISTORY_LIMIT }
