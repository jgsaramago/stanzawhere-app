import {
  addDays,
  addMonths,
  eachDayOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import type { Holiday, Person, ScheduleEvent } from '../types'

export function getWeekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end: addDays(start, 6) })
}

export function getMonthWeeks(anchor: Date): Date[][] {
  const monthStart = startOfMonth(anchor)
  const monthEnd = endOfMonth(anchor)
  const weekStarts = eachWeekOfInterval(
    { start: monthStart, end: monthEnd },
    { weekStartsOn: 1 },
  )
  return weekStarts.map((start) =>
    eachDayOfInterval({ start, end: addDays(start, 6) }),
  )
}

export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function eventCoversDay(event: ScheduleEvent, day: Date): boolean {
  const key = toDateKey(day)
  return key >= event.startDate && key <= event.endDate
}

export function eventOverlapsRange(
  event: ScheduleEvent,
  rangeStart: Date,
  rangeEnd: Date,
): boolean {
  const startKey = toDateKey(rangeStart)
  const endKey = toDateKey(rangeEnd)
  return event.startDate <= endKey && event.endDate >= startKey
}

export function eventsForPersonDay(
  events: ScheduleEvent[],
  personId: string,
  day: Date,
  statuses: ScheduleEvent['status'][] = ['approved', 'pending'],
): ScheduleEvent[] {
  return events.filter(
    (e) =>
      e.personId === personId &&
      statuses.includes(e.status) &&
      eventCoversDay(e, day),
  )
}

export function eventsInRange(
  events: ScheduleEvent[],
  rangeStart: Date,
  rangeEnd: Date,
  statuses: ScheduleEvent['status'][] = ['approved', 'pending'],
): ScheduleEvent[] {
  return events.filter(
    (e) =>
      statuses.includes(e.status) &&
      eventOverlapsRange(e, rangeStart, rangeEnd),
  )
}

export function holidaysForDay(
  holidays: Holiday[],
  day: Date,
  countryCodes: string[],
): Holiday[] {
  const key = toDateKey(day)
  return holidays.filter(
    (h) => h.date === key && countryCodes.includes(h.countryCode),
  )
}

export function formatTzTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function formatTzOffset(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
  }).formatToParts(date)
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
}

export function weekLocationForPerson(
  events: ScheduleEvent[],
  personId: string,
  weekDays: Date[],
): string | null {
  const start = weekDays[0]
  const end = weekDays[weekDays.length - 1]
  const location = events.find(
    (e) =>
      e.personId === personId &&
      e.type === 'location' &&
      e.status === 'approved' &&
      parseISO(e.startDate) <= end &&
      parseISO(e.endDate) >= start,
  )
  return location?.location ?? null
}

/** Resolve what "place" a person is in on a given day for the month color map */
export function placeForPersonDay(
  events: ScheduleEvent[],
  person: Person,
  day: Date,
): {
  place: string
  kind: 'pto' | 'travel' | 'location' | 'home' | 'remote'
  pending: boolean
} {
  const dayEvents = eventsForPersonDay(events, person.id, day, [
    'approved',
    'pending',
  ])
  const pto = dayEvents.find((e) => e.type === 'pto')
  if (pto) {
    return {
      place: 'PTO',
      kind: 'pto',
      pending: pto.status === 'pending',
    }
  }
  const travel = dayEvents.find((e) => e.type === 'travel')
  if (travel) {
    return {
      place: travel.location || travel.title || 'Travel',
      kind: 'travel',
      pending: travel.status === 'pending',
    }
  }
  const loc = dayEvents.find((e) => e.type === 'location')
  if (loc) {
    return {
      place: loc.location || loc.title || person.homeCity,
      kind: 'location',
      pending: loc.status === 'pending',
    }
  }
  // No travel / location / PTO logged → default to remote
  return { place: 'Remote', kind: 'remote', pending: false }
}

const PLACE_PALETTE = [
  '#0F766E',
  '#0369A1',
  '#B45309',
  '#7C3AED',
  '#BE123C',
  '#0E7490',
  '#4D7C0F',
  '#C2410C',
  '#1D4ED8',
  '#A21CAF',
]

export function colorForPlace(
  place: string,
  kind: 'pto' | 'travel' | 'location' | 'home' | 'remote',
): string {
  if (kind === 'pto') return '#94A3B8'
  if (kind === 'remote' || place.trim().toLowerCase() === 'remote') return '#CBD5E1'
  const key = place.trim().toLowerCase()
  const known: Record<string, string> = {
    'san francisco': '#0F766E',
    sf: '#0F766E',
    'sf hq': '#0F766E',
    chicago: '#1D4ED8',
    'new york': '#B45309',
    nyc: '#B45309',
    lisbon: '#0369A1',
    paris: '#A21CAF',
    london: '#0E7490',
    dallas: '#BE123C',
    connecticut: '#C2410C',
    atlanta: '#7C3AED',
    chesapeake: '#475569',
    'washington dc': '#475569',
    'washington d.c.': '#475569',
    denver: '#EA580C',
    remote: '#CBD5E1',
  }
  if (known[key]) return known[key]
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return PLACE_PALETTE[hash % PLACE_PALETTE.length]
}

export function summarizeWeek(
  events: ScheduleEvent[],
  people: Person[],
  weekDays: Date[],
): {
  travel: number
  pto: number
  location: number
  pending: number
  lines: { person: Person; text: string; status: ScheduleEvent['status'] }[]
} {
  const rangeEvents = eventsInRange(events, weekDays[0], weekDays[6])
  const lines = rangeEvents
    .map((e) => {
      const person = people.find((p) => p.id === e.personId)
      if (!person) return null
      const label =
        e.type === 'travel'
          ? `Travel · ${e.location || e.title}`
          : e.type === 'pto'
            ? `PTO · ${e.title}`
            : `Location · ${e.location || e.title}`
      return { person, text: label, status: e.status }
    })
    .filter(Boolean) as {
    person: Person
    text: string
    status: ScheduleEvent['status']
  }[]

  return {
    travel: rangeEvents.filter((e) => e.type === 'travel').length,
    pto: rangeEvents.filter((e) => e.type === 'pto').length,
    location: rangeEvents.filter((e) => e.type === 'location').length,
    pending: rangeEvents.filter((e) => e.status === 'pending').length,
    lines,
  }
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export { addMonths, format }
