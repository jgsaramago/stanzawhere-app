import type { Holiday, Person, ScheduleEvent, TimezoneLane } from '../types'

export const TIMEZONE_LANES: TimezoneLane[] = [
  { id: 'sf', label: 'PT', city: 'San Francisco', timezone: 'America/Los_Angeles' },
  { id: 'chi', label: 'CT', city: 'Chicago', timezone: 'America/Chicago' },
  { id: 'nyc', label: 'ET', city: 'New York', timezone: 'America/New_York' },
  { id: 'lis', label: 'WET', city: 'Lisbon', timezone: 'Europe/Lisbon' },
  { id: 'cet', label: 'CET', city: 'Paris', timezone: 'Europe/Paris' },
]

/**
 * Approval chain:
 * - Darwin → Nick
 * - Charlie, Anirban, João → Darwin
 * - Everyone else → Charlie
 * - Nick → auto-approved
 *
 * Drop headshots into /public/avatars with matching filenames.
 */
export const PEOPLE: Person[] = [
  {
    id: 'nick',
    name: 'Nick Mehta',
    email: 'nick@stanza.ai',
    role: 'manager',
    title: 'CEO',
    homeCity: 'San Francisco',
    homeCountry: 'US',
    timezone: 'America/Los_Angeles',
    avatarColor: '#0F766E',
    avatarUrl: '/avatars/nick-mehta.jpg',
    approverId: null,
  },
  {
    id: 'darwin',
    name: 'Darwin Deano',
    email: 'darwin@stanza.ai',
    role: 'manager',
    title: 'President',
    homeCity: 'Chicago',
    homeCountry: 'US',
    timezone: 'America/Chicago',
    avatarColor: '#1D4ED8',
    avatarUrl: '/avatars/darwin-deano.jpg',
    approverId: 'nick',
  },
  {
    id: 'charlie',
    name: 'Charlie Wieser',
    email: 'charlie@stanza.ai',
    role: 'manager',
    title: 'Strat & Ops',
    homeCity: 'Connecticut',
    homeCountry: 'US',
    timezone: 'America/New_York',
    avatarColor: '#B45309',
    avatarUrl: '/avatars/charlie-wieser.jpg',
    approverId: 'darwin',
  },
  {
    id: 'joao',
    name: 'João Saramago',
    email: 'joao@stanza.ai',
    role: 'member',
    title: 'Transf Lead',
    homeCity: 'Lisbon',
    homeCountry: 'PT',
    timezone: 'Europe/Lisbon',
    avatarColor: '#0369A1',
    avatarUrl: '/avatars/joao-saramago.jpg',
    approverId: 'darwin',
  },
  {
    id: 'anirban',
    name: 'Anirban Roy',
    email: 'anirban@stanza.ai',
    role: 'member',
    title: 'Transf Lead',
    homeCity: 'Dallas',
    homeCountry: 'US',
    timezone: 'America/Chicago',
    avatarColor: '#BE123C',
    avatarUrl: '/avatars/anirban-roy.jpg',
    approverId: 'darwin',
  },
  {
    id: 'leah',
    name: 'Leah Foushee',
    email: 'leah@stanza.ai',
    role: 'member',
    title: 'Delivery Ops',
    homeCity: 'Chicago',
    homeCountry: 'US',
    timezone: 'America/Chicago',
    avatarColor: '#0E7490',
    avatarUrl: '/avatars/leah-foushee.jpg',
    approverId: 'charlie',
  },
  {
    id: 'greg',
    name: 'Greg Wanroy',
    email: 'greg@stanza.ai',
    role: 'member',
    title: 'Team Lead',
    homeCity: 'Chicago',
    homeCountry: 'US',
    timezone: 'America/Chicago',
    avatarColor: '#7C3AED',
    avatarUrl: '/avatars/greg-wanroy.jpg',
    approverId: 'charlie',
  },
  {
    id: 'vaidehi',
    name: 'Vaidehi Paliwal',
    email: 'vaidehi@stanza.ai',
    role: 'member',
    title: 'PMO',
    homeCity: 'Atlanta',
    homeCountry: 'US',
    timezone: 'America/New_York',
    avatarColor: '#A21CAF',
    avatarUrl: '/avatars/vaidehi-paliwal.jpg',
    approverId: 'charlie',
  },
  {
    id: 'jonathan',
    name: 'Jonathan Oh',
    email: 'jonathan@stanza.ai',
    role: 'member',
    title: 'Tech Lead',
    homeCity: 'San Francisco',
    homeCountry: 'US',
    timezone: 'America/Los_Angeles',
    avatarColor: '#C2410C',
    avatarUrl: '/avatars/jonathan-oh.jpg',
    approverId: 'charlie',
  },
  {
    id: 'andrew',
    name: 'Andrew Stevens',
    email: 'andrew@stanza.ai',
    role: 'member',
    title: 'Tech Lead',
    homeCity: 'Chesapeake',
    homeCountry: 'US',
    timezone: 'America/New_York',
    avatarColor: '#475569',
    avatarUrl: '/avatars/andrew-stevens.jpg',
    approverId: 'charlie',
  },
]

export const HOLIDAYS: Holiday[] = [
  { date: '2026-01-01', name: "New Year's Day", countryCode: 'US' },
  { date: '2026-01-19', name: 'MLK Day', countryCode: 'US' },
  { date: '2026-02-16', name: "Presidents' Day", countryCode: 'US' },
  { date: '2026-05-25', name: 'Memorial Day', countryCode: 'US' },
  { date: '2026-06-19', name: 'Juneteenth', countryCode: 'US' },
  { date: '2026-07-03', name: 'Independence Day (obs.)', countryCode: 'US' },
  { date: '2026-09-07', name: 'Labor Day', countryCode: 'US' },
  { date: '2026-11-26', name: 'Thanksgiving', countryCode: 'US' },
  { date: '2026-12-25', name: 'Christmas Day', countryCode: 'US' },
  { date: '2027-01-01', name: "New Year's Day", countryCode: 'US' },
  { date: '2027-01-18', name: 'MLK Day', countryCode: 'US' },
  { date: '2026-01-01', name: 'Ano Novo', countryCode: 'PT' },
  { date: '2026-04-03', name: 'Sexta-feira Santa', countryCode: 'PT' },
  { date: '2026-04-05', name: 'Páscoa', countryCode: 'PT' },
  { date: '2026-04-25', name: 'Dia da Liberdade', countryCode: 'PT' },
  { date: '2026-05-01', name: 'Dia do Trabalhador', countryCode: 'PT' },
  { date: '2026-06-10', name: 'Dia de Portugal', countryCode: 'PT' },
  { date: '2026-08-15', name: 'Assunção', countryCode: 'PT' },
  { date: '2026-10-05', name: 'Implantação da República', countryCode: 'PT' },
  { date: '2026-12-01', name: 'Restauração da Independência', countryCode: 'PT' },
  { date: '2026-12-08', name: 'Imaculada Conceição', countryCode: 'PT' },
  { date: '2026-12-25', name: 'Natal', countryCode: 'PT' },
  { date: '2027-01-01', name: 'Ano Novo', countryCode: 'PT' },
]

function isoDaysFrom(base: Date, offset: number): string {
  const d = new Date(base)
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

const DALLAS_TRAVEL_IDS = ['darwin', 'charlie', 'nick', 'greg', 'anirban'] as const

/** Stable demo bookings that must appear on the calendar after refresh. */
export function buildFixedDemoEvents(now = new Date()): ScheduleEvent[] {
  const ts = now.toISOString()
  const events: ScheduleEvent[] = []

  for (const personId of DALLAS_TRAVEL_IDS) {
    const person = PEOPLE.find((p) => p.id === personId)!
    const approved = !person.approverId
    events.push({
      id: `demo_dallas_${personId}`,
      personId,
      type: 'travel',
      title: 'Travel to Dallas',
      startDate: '2026-08-18',
      endDate: '2026-08-20',
      location: 'Dallas',
      countryCode: 'US',
      notes: 'Dallas travel Tue–Thu next week (demo)',
      status: approved ? 'approved' : 'pending',
      requestedBy: 'joao',
      approverId: person.approverId,
      reviewedBy: approved ? personId : undefined,
      createdAt: ts,
      updatedAt: ts,
    })
  }

  for (const person of PEOPLE) {
    const approved = !person.approverId
    events.push({
      id: `demo_chicago_${person.id}`,
      personId: person.id,
      type: 'location',
      title: 'Week in Chicago',
      startDate: '2026-08-31',
      endDate: '2026-09-04',
      location: 'Chicago',
      countryCode: 'US',
      notes: 'All-team week location (demo)',
      status: approved ? 'approved' : 'pending',
      requestedBy: 'joao',
      approverId: person.approverId,
      reviewedBy: approved ? person.id : undefined,
      createdAt: ts,
      updatedAt: ts,
    })
  }

  for (const person of PEOPLE) {
    const approved = !person.approverId
    events.push({
      id: `demo_nyc_${person.id}`,
      personId: person.id,
      type: 'location',
      title: 'Week in New York',
      startDate: '2026-09-14',
      endDate: '2026-09-18',
      location: 'New York',
      countryCode: 'US',
      notes:
        'All-team week location (demo). San Francisco was the alternative — edit if you prefer SF.',
      status: approved ? 'approved' : 'pending',
      requestedBy: 'joao',
      approverId: person.approverId,
      reviewedBy: approved ? person.id : undefined,
      createdAt: ts,
      updatedAt: ts,
    })
  }

  return events
}

/** IDs of fixed demo events — used to merge missing demos into saved state. */
export function fixedDemoEventIds(): string[] {
  return buildFixedDemoEvents().map((e) => e.id)
}

export function buildSeedEvents(now = new Date()): ScheduleEvent[] {
  const mondayOffset = (now.getDay() + 6) % 7
  const weekStart = new Date(now)
  weekStart.setHours(12, 0, 0, 0)
  weekStart.setDate(now.getDate() - mondayOffset)
  const ts = now.toISOString()

  return [
    {
      id: 'e1',
      personId: 'joao',
      type: 'travel',
      title: 'SF leadership week',
      startDate: isoDaysFrom(weekStart, 1),
      endDate: isoDaysFrom(weekStart, 3),
      location: 'San Francisco',
      countryCode: 'US',
      notes: 'Onsite with Nick & Darwin',
      status: 'approved',
      requestedBy: 'joao',
      approverId: 'darwin',
      reviewedBy: 'darwin',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'e2',
      personId: 'leah',
      type: 'pto',
      title: 'Annual leave',
      startDate: isoDaysFrom(weekStart, 3),
      endDate: isoDaysFrom(weekStart, 4),
      location: 'Chicago',
      countryCode: 'US',
      status: 'approved',
      requestedBy: 'leah',
      approverId: 'charlie',
      reviewedBy: 'charlie',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'e3',
      personId: 'anirban',
      type: 'location',
      title: 'Week in NYC',
      startDate: isoDaysFrom(weekStart, 0),
      endDate: isoDaysFrom(weekStart, 4),
      location: 'New York',
      countryCode: 'US',
      status: 'approved',
      requestedBy: 'anirban',
      approverId: 'darwin',
      reviewedBy: 'darwin',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'e4',
      personId: 'greg',
      type: 'travel',
      title: 'Lisbon visit',
      startDate: isoDaysFrom(weekStart, 2),
      endDate: isoDaysFrom(weekStart, 5),
      location: 'Lisbon',
      countryCode: 'PT',
      notes: 'Delivery ops sync',
      status: 'pending',
      requestedBy: 'greg',
      approverId: 'charlie',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'e5',
      personId: 'vaidehi',
      type: 'location',
      title: 'Remote — NYC',
      startDate: isoDaysFrom(weekStart, 0),
      endDate: isoDaysFrom(weekStart, 6),
      location: 'New York',
      countryCode: 'US',
      status: 'pending',
      requestedBy: 'vaidehi',
      approverId: 'charlie',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'e6',
      personId: 'darwin',
      type: 'travel',
      title: 'SF board week',
      startDate: isoDaysFrom(weekStart, 0),
      endDate: isoDaysFrom(weekStart, 2),
      location: 'San Francisco',
      countryCode: 'US',
      status: 'pending',
      requestedBy: 'darwin',
      approverId: 'nick',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'e7',
      personId: 'jonathan',
      type: 'pto',
      title: 'PTO',
      startDate: isoDaysFrom(weekStart, 4),
      endDate: isoDaysFrom(weekStart, 4),
      location: 'San Francisco',
      countryCode: 'US',
      status: 'pending',
      requestedBy: 'jonathan',
      approverId: 'charlie',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'e8',
      personId: 'nick',
      type: 'location',
      title: 'SF HQ',
      startDate: isoDaysFrom(weekStart, 0),
      endDate: isoDaysFrom(weekStart, 4),
      location: 'San Francisco',
      countryCode: 'US',
      status: 'approved',
      requestedBy: 'nick',
      approverId: null,
      reviewedBy: 'nick',
      createdAt: ts,
      updatedAt: ts,
    },
    ...buildFixedDemoEvents(now),
  ]
}

export const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  PT: 'Portugal',
  GB: 'United Kingdom',
  FR: 'France',
  JP: 'Japan',
}

export function approverForPerson(person: Person): Person | null {
  if (!person.approverId) return null
  return PEOPLE.find((p) => p.id === person.approverId) ?? null
}
