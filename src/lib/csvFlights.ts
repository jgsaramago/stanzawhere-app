import type { FlightSegment, Person } from '../types'

export type CsvPersonTrip = {
  personId: string
  personName: string
  destinationCity?: string
  destinationCountry?: string
  startDate?: string
  endDate?: string
  flights: FlightSegment[]
  rawLine: string
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (ch === ',' && !inQuotes) {
      cells.push(cur.trim())
      cur = ''
      continue
    }
    cur += ch
  }
  cells.push(cur.trim())
  return cells
}

function normHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[\s_-]+/g, '')
}

function matchPerson(people: Person[], raw: string): Person | undefined {
  const q = raw.trim().toLowerCase()
  if (!q) return undefined
  return (
    people.find((p) => p.id === q) ||
    people.find((p) => p.email.toLowerCase() === q) ||
    people.find((p) => p.name.toLowerCase() === q) ||
    people.find((p) => p.name.toLowerCase().startsWith(q)) ||
    people.find((p) => {
      const first = p.name.split(/\s+/)[0]?.toLowerCase()
      return first === q || q.includes(first)
    })
  )
}

function detectRole(
  value: string | undefined,
  index: number,
  total: number,
): FlightSegment['role'] {
  const v = (value ?? '').toLowerCase()
  if (/arriv|inbound|return/.test(v)) return 'arrival'
  if (/depart|outbound|leave/.test(v)) return 'departure'
  if (/connect|layover/.test(v)) return 'connection'
  if (index === 0) return 'departure'
  if (index === total - 1) return 'arrival'
  return 'connection'
}

/**
 * Parse a simple CSV roster of flights.
 * Expected headers (any subset, case-insensitive):
 * person/name/traveler, flight/flightNumber, date, from/fromCode, to/toCode,
 * depart/departTime, arrive/arriveTime, role, destination/city, country
 */
export function parseFlightCsv(text: string, people: Person[]): {
  trips: CsvPersonTrip[]
  unmatched: string[]
} {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) return { trips: [], unmatched: [] }

  const headers = splitCsvLine(lines[0]).map(normHeader)
  const idx = (aliases: string[]) =>
    headers.findIndex((h) => aliases.some((a) => h === normHeader(a) || h.includes(normHeader(a))))

  const personIdx = idx(['person', 'name', 'traveler', 'colleague', 'employee'])
  const flightIdx = idx(['flight', 'flightnumber', 'flightno', 'flt'])
  const dateIdx = idx(['date', 'flightdate', 'day'])
  const fromIdx = idx(['from', 'fromcode', 'origin', 'departureairport'])
  const toIdx = idx(['to', 'tocode', 'dest', 'destinationairport', 'arrivalairport'])
  const depIdx = idx(['depart', 'departtime', 'departure', 'deptime'])
  const arrIdx = idx(['arrive', 'arrivetime', 'arrival', 'arrtime'])
  const roleIdx = idx(['role', 'leg', 'type'])
  const destIdx = idx(['destination', 'city', 'destinationcity'])
  const countryIdx = idx(['country', 'countrycode', 'destinationcountry'])

  if (personIdx < 0 || flightIdx < 0) {
    return { trips: [], unmatched: ['Need at least person/name and flight columns'] }
  }

  type Acc = {
    person: Person
    flights: FlightSegment[]
    destinationCity?: string
    destinationCountry?: string
    rawLines: string[]
  }
  const byPerson = new Map<string, Acc>()
  const unmatched: string[] = []

  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line)
    const personRaw = cells[personIdx] ?? ''
    const person = matchPerson(people, personRaw)
    if (!person) {
      unmatched.push(personRaw || line)
      continue
    }
    const flightNumber = (cells[flightIdx] ?? '').toUpperCase().replace(/\s+/g, '')
    if (!flightNumber) continue
    const date = dateIdx >= 0 ? cells[dateIdx] : undefined
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      unmatched.push(`${personRaw}: missing YYYY-MM-DD date`)
      continue
    }

    let acc = byPerson.get(person.id)
    if (!acc) {
      acc = {
        person,
        flights: [],
        destinationCity: destIdx >= 0 ? cells[destIdx] || undefined : undefined,
        destinationCountry: countryIdx >= 0 ? cells[countryIdx] || undefined : undefined,
        rawLines: [],
      }
      byPerson.set(person.id, acc)
    }
    acc.rawLines.push(line)
    if (destIdx >= 0 && cells[destIdx]) acc.destinationCity = cells[destIdx]
    if (countryIdx >= 0 && cells[countryIdx]) acc.destinationCountry = cells[countryIdx]

    acc.flights.push({
      flightNumber,
      fromCode: fromIdx >= 0 ? cells[fromIdx] || undefined : undefined,
      toCode: toIdx >= 0 ? cells[toIdx] || undefined : undefined,
      date,
      departTime: depIdx >= 0 ? cells[depIdx] || undefined : undefined,
      arriveTime: arrIdx >= 0 ? cells[arrIdx] || undefined : undefined,
      role: 'connection', // fixed below
    })
  }

  const trips: CsvPersonTrip[] = []
  for (const acc of byPerson.values()) {
    const flights = acc.flights.map((f, i) => ({
      ...f,
      role: detectRole(
        // role was not stored per-row in segment; re-read from raw if needed
        undefined,
        i,
        acc.flights.length,
      ),
    }))
    // Prefer explicit role column when present
    if (roleIdx >= 0) {
      for (let i = 0; i < flights.length; i++) {
        const cells = splitCsvLine(acc.rawLines[i] ?? '')
        flights[i].role = detectRole(cells[roleIdx], i, flights.length)
      }
    }

    const dates = flights.map((f) => f.date).sort()
    trips.push({
      personId: acc.person.id,
      personName: acc.person.name,
      destinationCity: acc.destinationCity,
      destinationCountry: acc.destinationCountry,
      startDate: dates[0],
      endDate: dates[dates.length - 1],
      flights,
      rawLine: acc.rawLines.join('\n'),
    })
  }

  return { trips, unmatched }
}

export function looksLikeFlightCsv(text: string): boolean {
  const first = text.replace(/^\uFEFF/, '').split(/\r?\n/).find((l) => l.trim())
  if (!first) return false
  const headers = splitCsvLine(first).map(normHeader)
  const hasPerson = headers.some((h) =>
    ['person', 'name', 'traveler', 'colleague'].some((a) => h.includes(a)),
  )
  const hasFlight = headers.some((h) => h.includes('flight'))
  return hasPerson && hasFlight && first.includes(',')
}
