import type { FlightSegment, ParsedFlightEmail } from '../types'

const AIRPORTS: Record<string, { city: string; country: string }> = {
  SFO: { city: 'San Francisco', country: 'US' },
  SJC: { city: 'San Francisco', country: 'US' },
  OAK: { city: 'San Francisco', country: 'US' },
  LAX: { city: 'Los Angeles', country: 'US' },
  JFK: { city: 'New York', country: 'US' },
  EWR: { city: 'New York', country: 'US' },
  LGA: { city: 'New York', country: 'US' },
  ORD: { city: 'Chicago', country: 'US' },
  MDW: { city: 'Chicago', country: 'US' },
  DFW: { city: 'Dallas', country: 'US' },
  DAL: { city: 'Dallas', country: 'US' },
  ATL: { city: 'Atlanta', country: 'US' },
  BOS: { city: 'Boston', country: 'US' },
  BDL: { city: 'Connecticut', country: 'US' },
  HVN: { city: 'Connecticut', country: 'US' },
  IAD: { city: 'Washington DC', country: 'US' },
  DCA: { city: 'Washington DC', country: 'US' },
  BWI: { city: 'Washington DC', country: 'US' },
  SEA: { city: 'Seattle', country: 'US' },
  DEN: { city: 'Denver', country: 'US' },
  MIA: { city: 'Miami', country: 'US' },
  LIS: { city: 'Lisbon', country: 'PT' },
  OPO: { city: 'Porto', country: 'PT' },
  LHR: { city: 'London', country: 'GB' },
  LGW: { city: 'London', country: 'GB' },
  CDG: { city: 'Paris', country: 'FR' },
  ORY: { city: 'Paris', country: 'FR' },
  FRA: { city: 'Frankfurt', country: 'DE' },
  MUC: { city: 'Munich', country: 'DE' },
  AMS: { city: 'Amsterdam', country: 'NL' },
  ZRH: { city: 'Zurich', country: 'CH' },
  GVA: { city: 'Geneva', country: 'CH' },
  MAD: { city: 'Madrid', country: 'ES' },
  BCN: { city: 'Barcelona', country: 'ES' },
  NRT: { city: 'Tokyo', country: 'JP' },
  HND: { city: 'Tokyo', country: 'JP' },
}

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`
}

function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/=\n/g, '')
    .replace(/=([0-9A-F]{2})/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    )
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
}

function parseFlexibleDate(chunk: string, fallbackYear: number): string | null {
  const iso = chunk.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`

  const mdY = chunk.match(
    /\b([A-Za-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?(?:,)?\s*(20\d{2})?\b/,
  )
  if (mdY) {
    const month = MONTHS[mdY[1].toLowerCase()]
    if (month) {
      const year = mdY[3] ? Number(mdY[3]) : fallbackYear
      return toIso(year, month, Number(mdY[2]))
    }
  }

  const dMY = chunk.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\s*(20\d{2})?\b/,
  )
  if (dMY) {
    const month = MONTHS[dMY[2].toLowerCase()]
    if (month) {
      const year = dMY[3] ? Number(dMY[3]) : fallbackYear
      return toIso(year, month, Number(dMY[1]))
    }
  }

  const slash = chunk.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/)
  if (slash) {
    return toIso(Number(slash[3]), Number(slash[1]), Number(slash[2]))
  }

  // 15AUG26 / 15AUG2026
  const compact = chunk.match(/\b(\d{1,2})([A-Za-z]{3})(20\d{2}|\d{2})\b/)
  if (compact) {
    const month = MONTHS[compact[2].toLowerCase()]
    if (month) {
      let year = Number(compact[3])
      if (year < 100) year += 2000
      return toIso(year, month, Number(compact[1]))
    }
  }

  return null
}

function parseTime(chunk: string): string | undefined {
  const m = chunk.match(/\b(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?\b/)
  if (!m) return undefined
  let hour = Number(m[1])
  const min = m[2]
  const ap = m[3]?.toUpperCase()
  if (ap === 'PM' && hour < 12) hour += 12
  if (ap === 'AM' && hour === 12) hour = 0
  return `${pad(hour)}:${min}`
}

function airportCity(code?: string): string | undefined {
  if (!code) return undefined
  return AIRPORTS[code.toUpperCase()]?.city
}

/**
 * Best-effort parser for airline confirmation emails / .eml text.
 * Supports common patterns from UA, AA, Delta, easyJet-style itineraries.
 */
export function parseFlightEmail(rawInput: string): ParsedFlightEmail {
  const text = normalizeText(rawInput)
  const yearFallback = new Date().getFullYear()
  const flights: FlightSegment[] = []

  const confirmation =
    text.match(
      /\b(?:confirmation|record\s*locator|booking\s*ref(?:erence)?|PNR)[:\s#]*([A-Z0-9]{5,8})\b/i,
    )?.[1] ?? undefined

  const airline =
    text.match(
      /\b(United|American|Delta|Lufthansa|TAP|British Airways|Air France|Southwest|JetBlue|Alaska|Emirates|Ryanair|easyJet)\b/i,
    )?.[1]

  // Pattern: UA 123 / Flight UA123 / AA1234 — take a window around each match
  const flightHits = [...text.matchAll(/\b(?:flight\s*)?([A-Z]{2})\s*(\d{1,4})\b/gi)]

  for (const block of flightHits) {
    const idx = block.index ?? 0
    const full = text.slice(idx, idx + 320)
    const flightNumber = `${block[1].toUpperCase()}${block[2]}`
    const route =
      full.match(/\b([A-Z]{3})\s*(?:[-–—>]|to|→)\s*([A-Z]{3})\b/i) ??
      full.match(/\bfrom\s+([A-Z]{3})\s+to\s+([A-Z]{3})\b/i)

    const fromCode = route?.[1]?.toUpperCase()
    const toCode = route?.[2]?.toUpperCase()
    const date = parseFlexibleDate(full, yearFallback)

    // Skip noise like "US 2026" style false positives without route/date
    if (!date && !fromCode && !toCode) continue
    if (!/^[A-Z]{2}\d{1,4}$/.test(flightNumber)) continue

    const times = [...full.matchAll(/\b(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\b/g)].map(
      (t) => parseTime(t[1]),
    )
    const departTime = times[0]
    const arriveTime = times[1]

    flights.push({
      flightNumber,
      fromCode,
      toCode,
      fromCity: airportCity(fromCode),
      toCity: airportCity(toCode),
      date: date ?? toIso(yearFallback, 1, 1),
      departTime,
      arriveTime,
      role: 'connection',
    })
  }

  // Deduplicate by flight+date
  const unique = new Map<string, FlightSegment>()
  for (const f of flights) {
    if (f.date.endsWith('-01-01') && !f.fromCode) continue
    const key = `${f.flightNumber}-${f.date}-${f.fromCode ?? ''}-${f.toCode ?? ''}`
    if (!unique.has(key)) unique.set(key, f)
  }
  let segments = [...unique.values()].sort((a, b) =>
    `${a.date}${a.departTime ?? ''}`.localeCompare(`${b.date}${b.departTime ?? ''}`),
  )

  if (segments.length === 1) {
    segments = [{ ...segments[0], role: 'departure' }]
  } else if (segments.length > 1) {
    segments = segments.map((s, i) => ({
      ...s,
      role:
        i === 0
          ? 'departure'
          : i === segments.length - 1
            ? 'arrival'
            : 'connection',
    }))
  }

  const startDate = segments[0]?.date
  const endDate = segments[segments.length - 1]?.date
  const first = segments[0]
  const last = segments[segments.length - 1]
  // Round-trip: prefer outbound destination (first leg's arrival city)
  const isRoundTrip =
    Boolean(first?.fromCode && last?.toCode && first.fromCode === last.toCode) ||
    Boolean(first?.fromCity && last?.toCity && first.fromCity === last.toCity)
  const destinationCity = isRoundTrip
    ? first?.toCity ?? airportCity(first?.toCode)
    : last?.toCity ?? airportCity(last?.toCode) ?? first?.toCity
  const destinationCountry = (() => {
    const code = isRoundTrip ? first?.toCode : last?.toCode ?? first?.toCode
    return code ? AIRPORTS[code]?.country : undefined
  })()

  return {
    airline,
    confirmation,
    destinationCity,
    destinationCountry,
    startDate,
    endDate,
    flights: segments,
    rawSnippet: text.slice(0, 400),
  }
}

export async function readDroppedFile(file: File): Promise<string> {
  const text = await file.text()
  // Prefer text/html body inside multipart .eml when present
  if (file.name.endsWith('.eml') || text.includes('Content-Type:')) {
    const html = text.match(
      /Content-Type:\s*text\/html[\s\S]*?\n\n([\s\S]*?)(?:\n--|\nContent-Type:|$)/i,
    )
    if (html?.[1]) return html[1]
    const plain = text.match(
      /Content-Type:\s*text\/plain[\s\S]*?\n\n([\s\S]*?)(?:\n--|\nContent-Type:|$)/i,
    )
    if (plain?.[1]) return plain[1]
  }
  return text
}
