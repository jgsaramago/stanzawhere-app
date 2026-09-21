import type { Holiday, Person, ScheduleEvent, TimezoneLane } from '../types'

export const TIMEZONE_LANES: TimezoneLane[] = [
  { id: 'sf', label: 'PT', city: 'San Francisco', timezone: 'America/Los_Angeles' },
  { id: 'den', label: 'MT', city: 'Denver', timezone: 'America/Denver' },
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
    name: 'Anirban Roy Choudhury',
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
  // Newer #team-all colleagues (Slack roster as of Sep 2026)
  {
    id: 'matt',
    name: 'Matt Mahowald',
    email: 'matt_mahowald@stanza.ai',
    role: 'member',
    title: 'Product',
    homeCity: 'San Francisco',
    homeCountry: 'US',
    timezone: 'America/Los_Angeles',
    avatarColor: '#0D9488',
    avatarUrl: '/avatars/matt-mahowald.jpg',
    approverId: 'charlie',
  },
  {
    id: 'erica',
    name: 'Erica Mansfield',
    email: 'erica@stanza.ai',
    role: 'member',
    title: 'Exec Assistant',
    homeCity: 'San Francisco',
    homeCountry: 'US',
    timezone: 'America/Los_Angeles',
    avatarColor: '#DB2777',
    avatarUrl: '/avatars/erica-mansfield.jpg',
    approverId: 'charlie',
  },
  {
    id: 'alok',
    name: 'Alok',
    email: 'alok@stanza.ai',
    role: 'member',
    title: 'Product',
    homeCity: 'New York',
    homeCountry: 'US',
    timezone: 'America/New_York',
    avatarColor: '#4F46E5',
    avatarUrl: '/avatars/alok.jpg',
    approverId: 'charlie',
  },
  {
    id: 'jeev',
    name: 'Jeev Balakrishnan',
    email: 'jeev_balakrishnan@stanza.ai',
    role: 'member',
    title: 'Team',
    homeCity: 'Denver',
    homeCountry: 'US',
    timezone: 'America/Denver',
    avatarColor: '#EA580C',
    avatarUrl: '/avatars/jeev-balakrishnan.jpg',
    approverId: 'charlie',
  },
  {
    id: 'boby',
    name: 'Boby Antony',
    email: 'boby@stanza.ai',
    role: 'member',
    title: 'Product',
    homeCity: 'Chicago',
    homeCountry: 'US',
    timezone: 'America/Chicago',
    avatarColor: '#0891B2',
    avatarUrl: '/avatars/boby-antony.jpg',
    approverId: 'charlie',
  },
  {
    id: 'isak',
    name: 'Isak Arms',
    email: 'isak@stanza.ai',
    role: 'member',
    title: 'Transf Assoc',
    homeCity: 'Chicago',
    homeCountry: 'US',
    timezone: 'America/Chicago',
    avatarColor: '#65A30D',
    avatarUrl: '/avatars/isak-arms.jpg',
    approverId: 'charlie',
  },
  {
    id: 'hani',
    name: 'Hani',
    email: 'hani@stanza.ai',
    role: 'member',
    title: 'Team',
    homeCity: 'Chicago',
    homeCountry: 'US',
    timezone: 'America/Chicago',
    avatarColor: '#CA8A04',
    avatarUrl: '/avatars/hani.jpg',
    approverId: 'charlie',
  },
  {
    id: 'joe',
    name: 'Joe Garnet',
    email: 'joe_garnet@stanza.ai',
    role: 'member',
    title: 'Team',
    homeCity: 'New York',
    homeCountry: 'US',
    timezone: 'America/New_York',
    avatarColor: '#9333EA',
    avatarUrl: '/avatars/joe-garnet.jpg',
    approverId: 'charlie',
  },
  {
    id: 'betsy',
    name: 'Betsy Peterson',
    email: 'betsy@stanza.ai',
    role: 'member',
    title: 'Team',
    homeCity: 'Chicago',
    homeCountry: 'US',
    timezone: 'America/Chicago',
    avatarColor: '#E11D48',
    avatarUrl: '/avatars/betsy-peterson.jpg',
    approverId: 'charlie',
  },
  {
    id: 'samuel',
    name: 'Samuel Mogil',
    email: 'samuel_mogil@stanza.ai',
    role: 'member',
    title: 'Team',
    homeCity: 'New York',
    homeCountry: 'US',
    timezone: 'America/New_York',
    avatarColor: '#2563EB',
    avatarUrl: '/avatars/samuel-mogil.jpg',
    approverId: 'charlie',
  },
  {
    id: 'somrat',
    name: 'Somrat Niyogi',
    email: 'somrat@recall.capital',
    role: 'member',
    title: 'Team',
    homeCity: 'San Francisco',
    homeCountry: 'US',
    timezone: 'America/Los_Angeles',
    avatarColor: '#7C2D12',
    avatarUrl: '/avatars/somrat-niyogi.jpg',
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

const OBSOLETE_DEMO_ID_PREFIXES = [
  'demo_dallas_',
  'demo_chicago_',
  'demo_nyc_',
] as const

export function isObsoleteDemoEventId(id: string): boolean {
  return OBSOLETE_DEMO_ID_PREFIXES.some((prefix) => id.startsWith(prefix))
}

type HeidelbergTrip = {
  personId: string
  arriveDate: string
  departDate: string
  arriveTime: string
  departTime: string
  fromCode: string
  toCode: string
  arriveFlight?: string
  departFlight?: string
  hotel?: string
}

/** Heidelberg / FRA week — Sep 27–Oct 1 2026 (stable ids for refresh upsert). */
const HEIDELBERG_TRIPS: HeidelbergTrip[] = [
  {
    personId: 'nick',
    arriveDate: '2026-09-28',
    departDate: '2026-09-30',
    arriveTime: '09:45',
    departTime: '17:15',
    fromCode: 'SFO',
    toCode: 'JFK',
    arriveFlight: 'UA58',
    hotel: 'Heidelberg Marriott',
  },
  {
    personId: 'charlie',
    arriveDate: '2026-09-28',
    departDate: '2026-09-30',
    arriveTime: '09:45',
    departTime: '17:15',
    fromCode: 'SFO',
    toCode: 'JFK',
    hotel: 'Heidelberg Marriott',
  },
  {
    personId: 'somrat',
    arriveDate: '2026-09-28',
    departDate: '2026-09-30',
    arriveTime: '09:10',
    departTime: '17:30',
    fromCode: 'EWR',
    toCode: 'SFO',
    hotel: 'Heidelberg Marriott Hotel',
  },
  {
    personId: 'matt',
    arriveDate: '2026-09-28',
    departDate: '2026-09-30',
    arriveTime: '09:45',
    departTime: '17:30',
    fromCode: 'SFO',
    toCode: 'SFO',
    arriveFlight: 'UA58',
  },
  {
    personId: 'anirban',
    arriveDate: '2026-09-28',
    departDate: '2026-10-01',
    arriveTime: '08:45',
    departTime: '10:55',
    fromCode: 'DFW',
    toCode: 'DFW',
    hotel: 'Heidelberg Marriott',
  },
  {
    personId: 'joao',
    arriveDate: '2026-09-28',
    departDate: '2026-09-30',
    arriveTime: '11:30',
    departTime: '13:20',
    fromCode: 'LIS',
    toCode: 'LIS',
    hotel: 'Heidelberg Marriott',
  },
  {
    personId: 'jonathan',
    arriveDate: '2026-09-27',
    departDate: '2026-10-01',
    arriveTime: '05:45',
    departTime: '12:30',
    fromCode: 'BOS',
    toCode: 'BOS',
    hotel: 'Heidelberg Marriott Hotel',
  },
]

/** Stable demo bookings that must appear on the calendar after refresh. */
export function buildFixedDemoEvents(now = new Date()): ScheduleEvent[] {
  const ts = now.toISOString()
  const events: ScheduleEvent[] = []

  for (const trip of HEIDELBERG_TRIPS) {
    const person = PEOPLE.find((p) => p.id === trip.personId)
    if (!person) continue
    const approved = !person.approverId
    const hotelNote = trip.hotel ? `Hotel: ${trip.hotel}` : 'Hotel: TBD'
    const arriveFlight = trip.arriveFlight ?? `${trip.fromCode}-FRA`
    const departFlight = trip.departFlight ?? `FRA-${trip.toCode}`

    events.push({
      id: `demo_heidelberg_travel_${trip.personId}`,
      personId: trip.personId,
      type: 'travel',
      title: 'SAP Stanza workshop',
      startDate: trip.arriveDate,
      endDate: trip.departDate,
      location: 'SAP Stanza workshop',
      countryCode: 'DE',
      hotel: trip.hotel,
      notes: `${hotelNote}. Arrive FRA ${trip.arriveTime} from ${trip.fromCode}; depart FRA ${trip.departTime} to ${trip.toCode}.`,
      dressCode: 'business-casual',
      status: approved ? 'approved' : 'pending',
      requestedBy: trip.personId,
      approverId: person.approverId,
      reviewedBy: approved ? trip.personId : undefined,
      createdAt: ts,
      updatedAt: ts,
      flights: [
        {
          flightNumber: arriveFlight,
          fromCode: trip.fromCode,
          toCode: 'FRA',
          fromCity: trip.fromCode,
          toCity: 'Frankfurt',
          date: trip.arriveDate,
          arriveTime: trip.arriveTime,
          role: 'arrival',
        },
        {
          flightNumber: departFlight,
          fromCode: 'FRA',
          toCode: trip.toCode,
          fromCity: 'Frankfurt',
          toCity: trip.toCode,
          date: trip.departDate,
          departTime: trip.departTime,
          role: 'departure',
        },
      ],
    })

    events.push({
      id: `demo_heidelberg_loc_${trip.personId}`,
      personId: trip.personId,
      type: 'location',
      title: hotelNote,
      startDate: trip.arriveDate,
      endDate: trip.departDate,
      location: 'SAP Stanza workshop',
      countryCode: 'DE',
      hotel: trip.hotel,
      notes: hotelNote,
      dressCode: 'business-casual',
      status: approved ? 'approved' : 'pending',
      requestedBy: trip.personId,
      approverId: person.approverId,
      reviewedBy: approved ? trip.personId : undefined,
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

export { COUNTRY_NAMES, COUNTRY_OPTIONS } from './countries'

export function approverForPerson(person: Person): Person | null {
  if (!person.approverId) return null
  return PEOPLE.find((p) => p.id === person.approverId) ?? null
}
