import { addDays, format, parseISO, startOfDay, startOfWeek } from 'date-fns'
import { COUNTRY_NAMES } from '../data/seed'
import type { ApprovalStatus, EventType, Person, ScheduleEvent } from '../types'
import { toDateKey, uid } from './dates'

export type BookingNeed =
  | 'ready'
  | 'need-dates'
  | 'need-destination'
  | 'need-person'
  | 'not-booking'

export type PlaceRef = { location: string; countryCode: string }

export type BookingIntent = {
  type: EventType
  /** Preferred: all subjects for this request. Empty → current user at build time. */
  personIds?: string[]
  /** @deprecated use personIds; kept as first subject for clarifications */
  personId?: string
  location?: string
  countryCode?: string
  /** When the user offered multiple cities (e.g. "NY or SF"), ask before booking. */
  destinationOptions?: PlaceRef[]
  startDate?: string
  endDate?: string
  need: BookingNeed
}

const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  a: 1,
  an: 1,
}

const MONTHS: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sept: 8,
  sep: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
}

const WEEKDAY_TO_JS: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thur: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
}

const WEEKDAY_ALT =
  'sun(?:day)?|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs?(?:day)?)?|fri(?:day)?|sat(?:urday)?'

const MONTH_ALT =
  'january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec'

/** Common place → country code (beyond COUNTRY_NAMES). */
const PLACE_HINTS: Record<string, { location: string; countryCode: string }> = {
  japan: { location: 'Japan', countryCode: 'JP' },
  tokyo: { location: 'Tokyo', countryCode: 'JP' },
  osaka: { location: 'Osaka', countryCode: 'JP' },
  portugal: { location: 'Portugal', countryCode: 'PT' },
  lisbon: { location: 'Lisbon', countryCode: 'PT' },
  lisboa: { location: 'Lisbon', countryCode: 'PT' },
  france: { location: 'France', countryCode: 'FR' },
  paris: { location: 'Paris', countryCode: 'FR' },
  'united kingdom': { location: 'United Kingdom', countryCode: 'GB' },
  uk: { location: 'United Kingdom', countryCode: 'GB' },
  london: { location: 'London', countryCode: 'GB' },
  'united states': { location: 'United States', countryCode: 'US' },
  usa: { location: 'United States', countryCode: 'US' },
  'san francisco': { location: 'San Francisco', countryCode: 'US' },
  sf: { location: 'San Francisco', countryCode: 'US' },
  sfo: { location: 'San Francisco', countryCode: 'US' },
  chicago: { location: 'Chicago', countryCode: 'US' },
  'new york': { location: 'New York', countryCode: 'US' },
  nyc: { location: 'New York', countryCode: 'US' },
  ny: { location: 'New York', countryCode: 'US' },
  dallas: { location: 'Dallas', countryCode: 'US' },
}

/** Explicit typo → canonical place key in PLACE_HINTS. */
const PLACE_TYPOS: Record<string, string> = {
  dalas: 'dallas',
  dalllas: 'dallas',
  chigago: 'chicago',
  chicgo: 'chicago',
}

function parseNumberToken(token: string): number | null {
  if (/^\d+$/.test(token)) return Number(token)
  return WORD_NUMBERS[token.toLowerCase()] ?? null
}

function editDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[m][n]
}

/** Normalize common chat typos before parsing. */
export function normalizeBookingText(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\b3st\b/g, '31st')
    .replace(/\b2ndd\b/g, '2nd')
    .replace(/\b1th\b/g, '1st')
    .replace(/\b2th\b/g, '2nd')
    .replace(/\b3th\b/g, '3rd')
    .replace(/\bdalas\b/g, 'dallas')
}

function resolvePlaceToken(
  token: string,
): { location: string; countryCode: string } | null {
  const t = token.trim().toLowerCase().replace(/\s+/g, ' ')
  if (!t) return null
  if (PLACE_HINTS[t]) return PLACE_HINTS[t]
  const viaTypo = PLACE_TYPOS[t]
  if (viaTypo && PLACE_HINTS[viaTypo]) return PLACE_HINTS[viaTypo]
  for (const key of Object.keys(PLACE_HINTS)) {
    if (
      key.length >= 4 &&
      t.length >= 4 &&
      Math.abs(key.length - t.length) <= 1 &&
      editDistance(t, key) <= 1
    ) {
      return PLACE_HINTS[key]
    }
  }
  return null
}

function dayOffsetFromMonday(jsDay: number): number {
  return (jsDay + 6) % 7
}

function parseWeekdayToken(token: string): number | null {
  const key = token.toLowerCase().replace(/\.$/, '')
  if (key in WEEKDAY_TO_JS) return WEEKDAY_TO_JS[key]
  // "tues" / "thurs" already covered; try prefix
  for (const [name, dow] of Object.entries(WEEKDAY_TO_JS)) {
    if (name.startsWith(key) && key.length >= 3) return dow
  }
  return null
}

function workWeekForDate(anchor: Date): { startDate: string; endDate: string } {
  const mon = startOfWeek(anchor, { weekStartsOn: 1 })
  return {
    startDate: toDateKey(mon),
    endDate: toDateKey(addDays(mon, 4)),
  }
}

function resolveCalendarYear(monthIndex: number, day: number, today: Date, year?: number): number {
  if (year != null && Number.isFinite(year)) return year
  const y = today.getFullYear()
  const candidate = new Date(y, monthIndex, day)
  if (startOfDay(candidate) < startOfDay(today)) return y + 1
  return y
}

function extractWeekOfMonthDay(
  q: string,
  today: Date,
): { startDate: string; endDate: string } | null {
  // "week of the 31st August" / "week of 31 August 2026"
  const dayFirst = q.match(
    new RegExp(
      `\\b(?:in\\s+the\\s+)?week\\s+of\\s+(?:the\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_ALT})(?:\\s+(\\d{4}))?\\b`,
    ),
  )
  if (dayFirst) {
    const day = Number(dayFirst[1])
    const monthIndex = MONTHS[dayFirst[2]]
    const year = resolveCalendarYear(
      monthIndex,
      day,
      today,
      dayFirst[3] ? Number(dayFirst[3]) : undefined,
    )
    if (day >= 1 && day <= 31 && monthIndex != null) {
      return workWeekForDate(new Date(year, monthIndex, day))
    }
  }

  // "week of August 31st" / "week of Aug 31"
  const monthFirst = q.match(
    new RegExp(
      `\\b(?:in\\s+the\\s+)?week\\s+of\\s+(${MONTH_ALT})(?:\\s+the)?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+(\\d{4}))?\\b`,
    ),
  )
  if (monthFirst) {
    const monthIndex = MONTHS[monthFirst[1]]
    const day = Number(monthFirst[2])
    const year = resolveCalendarYear(
      monthIndex,
      day,
      today,
      monthFirst[3] ? Number(monthFirst[3]) : undefined,
    )
    if (day >= 1 && day <= 31 && monthIndex != null) {
      return workWeekForDate(new Date(year, monthIndex, day))
    }
  }

  return null
}

function extractWeekdayRange(
  q: string,
  today: Date,
): { startDate: string; endDate: string } | null {
  const m = q.match(
    new RegExp(
      `(?:from\\s+)?(${WEEKDAY_ALT})\\s*(?:to|-|through|until)\\s*(${WEEKDAY_ALT})`,
      'i',
    ),
  )
  if (!m) return null

  const startDow = parseWeekdayToken(m[1])
  const endDow = parseWeekdayToken(m[2])
  if (startDow == null || endDow == null) return null

  let weekMon: Date
  if (/\bnext week\b/.test(q)) {
    weekMon = startOfWeek(addDays(today, 7), { weekStartsOn: 1 })
  } else if (/\bthis week\b/.test(q)) {
    weekMon = startOfWeek(today, { weekStartsOn: 1 })
  } else {
    weekMon = startOfWeek(today, { weekStartsOn: 1 })
    const startCandidate = addDays(weekMon, dayOffsetFromMonday(startDow))
    if (startOfDay(startCandidate) < startOfDay(today)) {
      weekMon = addDays(weekMon, 7)
    }
  }

  let start = addDays(weekMon, dayOffsetFromMonday(startDow))
  let end = addDays(weekMon, dayOffsetFromMonday(endDow))
  if (end < start) end = addDays(end, 7)

  return { startDate: toDateKey(start), endDate: toDateKey(end) }
}

function extractRelativeDates(
  q: string,
  today: Date,
): { startDate?: string; endDate?: string } {
  // "from 2026-09-01 to 2026-09-05" or "2026-09-01 to 2026-09-05"
  const range = q.match(
    /(?:from\s+)?(\d{4}-\d{2}-\d{2})\s*(?:to|-|through|until)\s*(\d{4}-\d{2}-\d{2})/,
  )
  if (range) {
    const startDate = range[1]
    const endDate = range[2] < range[1] ? range[1] : range[2]
    return { startDate, endDate }
  }

  const singleIso = q.match(/\b(\d{4}-\d{2}-\d{2})\b/)
  if (singleIso) {
    const startDate = singleIso[1]
    return { startDate, endDate: toDateKey(addDays(parseISO(startDate), 4)) }
  }

  const weekOf = extractWeekOfMonthDay(q, today)
  if (weekOf) return weekOf

  const weekdayRange = extractWeekdayRange(q, today)
  if (weekdayRange) return weekdayRange

  if (/\btomorrow\b/.test(q)) {
    const start = addDays(today, 1)
    return { startDate: toDateKey(start), endDate: toDateKey(start) }
  }

  if (/\bnext week\b/.test(q)) {
    const nextMon = startOfWeek(addDays(today, 7), { weekStartsOn: 1 })
    return {
      startDate: toDateKey(nextMon),
      endDate: toDateKey(addDays(nextMon, 4)),
    }
  }

  const weeks = q.match(
    /\bin\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|a|an)\s+weeks?\b/,
  )
  if (weeks) {
    const n = parseNumberToken(weeks[1]) ?? 1
    const start = addDays(today, n * 7)
    return {
      startDate: toDateKey(start),
      endDate: toDateKey(addDays(start, 4)),
    }
  }

  const days = q.match(
    /\bin\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|a|an)\s+days?\b/,
  )
  if (days) {
    const n = parseNumberToken(days[1]) ?? 1
    const start = addDays(today, n)
    return {
      startDate: toDateKey(start),
      endDate: toDateKey(addDays(start, 4)),
    }
  }

  // "for two weeks" as duration starting today — less common for booking start
  const forWeeks = q.match(
    /\bfor\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+weeks?\b/,
  )
  if (forWeeks && !/\bin\s+/.test(q)) {
    const n = parseNumberToken(forWeeks[1]) ?? 1
    const start = today
    return {
      startDate: toDateKey(start),
      endDate: toDateKey(addDays(start, n * 7 - 1)),
    }
  }

  return {}
}

function personNameTokens(people: Person[]): Set<string> {
  const set = new Set<string>()
  for (const p of people) {
    const parts = p.name.toLowerCase().split(/\s+/).filter(Boolean)
    for (const part of parts) {
      if (part.length > 2) set.add(part)
    }
  }
  return set
}

/** All distinct known places mentioned in the message (longest keys first). */
function findMentionedPlaces(q: string): PlaceRef[] {
  const found: PlaceRef[] = []
  const seen = new Set<string>()
  const knownKeys = Object.keys(PLACE_HINTS).sort((a, b) => b.length - a.length)
  let remaining = q
  for (const key of knownKeys) {
    const re = new RegExp(`\\b${key.replace(/\s+/g, '\\s+')}\\b`)
    if (re.test(remaining)) {
      const place = PLACE_HINTS[key]
      if (!seen.has(place.location)) {
        seen.add(place.location)
        found.push(place)
      }
      // Avoid double-counting overlapping aliases (e.g. "new york" + "ny")
      remaining = remaining.replace(re, ' ')
    }
  }
  // Fuzzy single-token typos for places not already found
  const words = q.split(/[^a-z]+/).filter((w) => w.length >= 4)
  for (const word of words) {
    const resolved = resolvePlaceToken(word)
    if (resolved && !seen.has(resolved.location)) {
      seen.add(resolved.location)
      found.push(resolved)
    }
  }
  return found
}

function extractDestination(
  q: string,
  people: Person[] = [],
): {
  location?: string
  countryCode?: string
  options?: PlaceRef[]
} {
  const personTokens = personNameTokens(people)
  const mentioned = findMentionedPlaces(q)

  // "New York or San Francisco" / "either NY or SF" — do not silently pick one
  if (mentioned.length >= 2 && /\b(or|either)\b/.test(q)) {
    return { options: mentioned }
  }
  if (mentioned.length === 1) {
    return mentioned[0]
  }

  // Collect preposition phrases ("in Chicago", "for Japan", "to Dallas")
  const candidates: string[] = []
  const prepRe =
    /\b(?:for|to|in|at)\s+([a-z][a-z\s]{0,40}?)(?=\s+(?:in|on|from|next|for|to|the|week|and|or|,)|\s*[?.!,]|$)/gi
  let prepMatch: RegExpExecArray | null
  while ((prepMatch = prepRe.exec(q)) != null) {
    candidates.push(prepMatch[1].trim().toLowerCase())
  }

  for (const [code, name] of Object.entries(COUNTRY_NAMES)) {
    if (q.includes(name.toLowerCase())) {
      return { location: name, countryCode: code }
    }
  }

  for (const raw of candidates) {
    if (
      /^(a|an|\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(day|days|week|weeks)$/.test(
        raw,
      )
    ) {
      continue
    }
    if (/^(two|a few|some)\s+weeks?$/.test(raw)) continue
    if (/^(next|this|the)\s+week$/.test(raw)) continue
    if (
      /^(the\s+)?(team|everyone|request|approval|calendar|pto|travel|full)$/.test(raw)
    ) {
      continue
    }
    const first = raw.split(/\s+/)[0]
    if (personTokens.has(first)) continue

    const resolved = resolvePlaceToken(raw)
    if (resolved) return resolved

    for (const [code, name] of Object.entries(COUNTRY_NAMES)) {
      if (name.toLowerCase() === raw) return { location: name, countryCode: code }
    }
    if (raw.length >= 2 && !/^(approval|request|calendar|pto|travel)$/.test(raw)) {
      return { location: raw.replace(/\b\w/g, (c) => c.toUpperCase()) }
    }
  }

  return {}
}

/** Match a short clarifying reply to a known place (incl. NY/SF/SFO/NYC). */
function matchPlaceChoice(q: string, options?: PlaceRef[]): PlaceRef | null {
  const mentioned = findMentionedPlaces(q)
  const chosen =
    mentioned.length === 1
      ? mentioned[0]
      : resolvePlaceToken(q.trim()) ??
        (mentioned.length > 0 && options
          ? mentioned.find((m) => options.some((o) => o.location === m.location)) ??
            null
          : null)

  if (!chosen) return null
  if (!options || options.length === 0) return chosen
  return options.find((o) => o.location === chosen.location) ?? null
}

function wantsAllTeam(q: string): boolean {
  return /\b(all(?:\s+the)?\s+team|full\s+team|the\s+full\s+team|everyone|whole\s+team|entire\s+team|the\s+whole\s+team)\b/.test(
    q,
  )
}

function extractPersonIds(q: string, people: Person[]): string[] {
  if (wantsAllTeam(q)) return people.map((p) => p.id)

  const sorted = [...people].sort((a, b) => b.name.length - a.name.length)
  const found: string[] = []
  const used = new Set<string>()

  for (const p of sorted) {
    const full = p.name.toLowerCase()
    const first = full.split(/\s+/)[0]
    const matchesFull = q.includes(full)
    const matchesFirst =
      first.length > 2 && new RegExp(`\\b${first}\\b`).test(q)
    if ((matchesFull || matchesFirst) && !used.has(p.id)) {
      found.push(p.id)
      used.add(p.id)
    }
  }

  // Preserve mention order in the original message when possible
  return found.sort((a, b) => {
    const pa = people.find((p) => p.id === a)!
    const pb = people.find((p) => p.id === b)!
    const ia = q.indexOf(pa.name.split(/\s+/)[0].toLowerCase())
    const ib = q.indexOf(pb.name.split(/\s+/)[0].toLowerCase())
    return ia - ib
  })
}

function detectType(q: string): EventType {
  if (/\b(pto|time off|vacation|out of office|ooo|leave)\b/.test(q)) return 'pto'
  if (/\b(week\s+of|in\s+the\s+week|week\s+location)\b/.test(q)) return 'location'
  if (/\b(working\s+from|based\s+in|wfh|remote\s+in)\b/.test(q)) return 'location'
  // "week in X" but not "next/this week in X" (travel phrasing)
  if (/\bweek\s+in\b/.test(q) && !/\b(next|this)\s+week\s+in\b/.test(q)) {
    return 'location'
  }
  if (/\bweek\s+at\b/.test(q) && !/\b(next|this)\s+week\s+at\b/.test(q)) {
    return 'location'
  }
  // "all team in Chicago …" without travel verbs → week location
  if (wantsAllTeam(q) && /\bin\b/.test(q) && !/\b(travel|trip|fly|flight)\b/.test(q)) {
    return 'location'
  }
  return 'travel'
}

function looksLikeBooking(q: string, today: Date, people: Person[]): boolean {
  if (
    /\b(book|schedule|create|submit|add|generate|make)\b/.test(q) &&
    /\b(request|travel|trip|pto|vacation|time off|location|flight|week)\b/.test(q)
  ) {
    return true
  }
  if (/\b(book|schedule|generate)\b.+\b(for|to|in)\b/.test(q)) return true
  if (/\b(travel|trip|fly|going)\b.+\b(to|for)\b/.test(q)) return true
  if (/\b(pto|time off|vacation)\b.+\b(from|on|in|next|tomorrow)\b/.test(q)) {
    return true
  }
  if (/\bweek in\b/.test(q)) return true
  if (/\bworking from\b/.test(q)) return true
  if (/\bweek of\b/.test(q)) return true
  if (/\bshould be in\b/.test(q)) return true

  const dest = extractDestination(q, people)
  const dates = extractRelativeDates(q, today)
  const hasPlace = Boolean(dest.location || (dest.options && dest.options.length > 0))
  if (
    hasPlace &&
    dates.startDate &&
    /\b(book|request|add|schedule|generate|travel|trip|team|everyone|full)\b/.test(q)
  ) {
    return true
  }
  if (wantsAllTeam(q) && hasPlace && dates.startDate) return true
  return false
}

function resolveNeed(intent: Omit<BookingIntent, 'need'>): BookingNeed {
  if (intent.type !== 'pto' && !intent.location) return 'need-destination'
  if (!intent.startDate) return 'need-dates'
  return 'ready'
}

function withPersonFields(
  personIds: string[],
): Pick<BookingIntent, 'personId' | 'personIds'> {
  return {
    personIds,
    personId: personIds[0],
  }
}

/** Parse a natural-language booking message into a structured intent. */
export function parseBookingIntent(
  input: string,
  people: Person[],
  today: Date = new Date(),
): BookingIntent {
  const q = normalizeBookingText(input)
  if (!q || !looksLikeBooking(q, today, people)) {
    return { type: 'travel', need: 'not-booking' }
  }

  const type = detectType(q)
  const dates = extractRelativeDates(q, today)
  const dest = type === 'pto' ? {} : extractDestination(q, people)
  const personIds = extractPersonIds(q, people)

  const partial: Omit<BookingIntent, 'need'> = {
    type,
    ...withPersonFields(personIds),
    location: dest.location,
    countryCode: dest.countryCode,
    destinationOptions: dest.options,
    startDate: dates.startDate,
    endDate: dates.endDate,
  }

  return { ...partial, need: resolveNeed(partial) }
}

/** Merge a short clarifying reply into a pending booking intent. */
export function mergeBookingClarification(
  pending: BookingIntent,
  input: string,
  people: Person[],
  today: Date = new Date(),
): BookingIntent {
  const q = normalizeBookingText(input)
  if (!q) return pending

  const dates = extractRelativeDates(q, today)
  const dest = extractDestination(q, people)
  const personIds = extractPersonIds(q, people)
  const choice = matchPlaceChoice(q, pending.destinationOptions)

  let location = choice?.location ?? dest.location
  let countryCode = choice?.countryCode ?? dest.countryCode
  if (!location) {
    const hint = resolvePlaceToken(q.trim())
    if (hint) {
      location = hint.location
      countryCode = hint.countryCode
    } else {
      for (const [code, name] of Object.entries(COUNTRY_NAMES)) {
        if (name.toLowerCase() === q.trim()) {
          location = name
          countryCode = code
        }
      }
    }
  }

  const mergedIds =
    personIds.length > 0
      ? personIds
      : pending.personIds?.length
        ? pending.personIds
        : pending.personId
          ? [pending.personId]
          : []

  const next: Omit<BookingIntent, 'need'> = {
    type: pending.type,
    ...withPersonFields(mergedIds),
    location: location ?? pending.location,
    countryCode: countryCode ?? pending.countryCode,
    // Clear options once a city is chosen
    destinationOptions: location ? undefined : (dest.options ?? pending.destinationOptions),
    startDate: dates.startDate ?? pending.startDate,
    endDate: dates.endDate ?? pending.endDate,
  }

  return { ...next, need: resolveNeed(next) }
}

export function clarifyingQuestion(intent: BookingIntent, people: Person[]): string {
  if (intent.need === 'need-destination') {
    const opts = intent.destinationOptions
    if (opts && opts.length >= 2) {
      if (opts.length === 2) {
        return `${opts[0].location} or ${opts[1].location}?`
      }
      return `Which city? ${opts.map((o) => o.location).join(', ')}`
    }
    return 'Where should I book this for? (e.g. Japan, Tokyo, Lisbon)'
  }
  if (intent.need === 'need-dates') {
    return 'When should this be? Try “in two weeks”, “next week”, “Tuesday to Thursday next week”, or “week of August 31”.'
  }
  if (intent.need === 'need-person') {
    const names = people
      .slice(0, 5)
      .map((p) => p.name.split(' ')[0])
      .join(', ')
    return `Who is this for? (${names}…)`
  }
  return 'Could you share a bit more so I can create the request?'
}

function subjectIdsForIntent(intent: BookingIntent, currentUser: Person): string[] {
  if (intent.personIds && intent.personIds.length > 0) return intent.personIds
  if (intent.personId) return [intent.personId]
  return [currentUser.id]
}

export function buildBookingEvent(
  intent: BookingIntent,
  currentUser: Person,
  people: Person[],
): ScheduleEvent | null {
  const events = buildBookingEvents(intent, currentUser, people)
  return events[0] ?? null
}

/** Build one event per named / team subject. */
export function buildBookingEvents(
  intent: BookingIntent,
  currentUser: Person,
  people: Person[],
): ScheduleEvent[] {
  if (intent.need !== 'ready' || !intent.startDate) return []

  const startDate = intent.startDate
  const endDate =
    intent.endDate && intent.endDate >= startDate
      ? intent.endDate
      : toDateKey(addDays(parseISO(startDate), intent.type === 'pto' ? 0 : 4))

  const location = intent.location
  const now = new Date().toISOString()
  const ids = subjectIdsForIntent(intent, currentUser)

  return ids.map((id) => {
    const subject = people.find((p) => p.id === id) ?? currentUser
    const countryCode = intent.countryCode ?? subject.homeCountry
    const title =
      intent.type === 'pto'
        ? 'PTO'
        : intent.type === 'location'
          ? `Week in ${location || subject.homeCity}`
          : `Travel to ${location || 'destination'}`

    const status: ApprovalStatus = 'approved'

    return {
      id: uid('evt'),
      personId: subject.id,
      type: intent.type,
      title,
      startDate,
      endDate,
      location: location || undefined,
      countryCode,
      notes: 'Created via StanBot',
      status,
      requestedBy: currentUser.id,
      approverId: null,
      reviewedBy: currentUser.id,
      createdAt: now,
      updatedAt: now,
    }
  })
}

function formatWhen(event: ScheduleEvent): string {
  return event.startDate === event.endDate
    ? format(parseISO(event.startDate), 'MMM d, yyyy')
    : `${format(parseISO(event.startDate), 'MMM d')} – ${format(parseISO(event.endDate), 'MMM d, yyyy')}`
}

function typeLabel(type: EventType): string {
  return type === 'pto' ? 'PTO' : type === 'location' ? 'week location' : 'travel'
}

export function formatBookingConfirmation(
  event: ScheduleEvent,
  person: Person,
  approverName: string | null,
): string {
  const place =
    event.type === 'pto'
      ? ''
      : ` for ${event.location || COUNTRY_NAMES[event.countryCode ?? ''] || 'destination'}`
  const statusLine =
    event.status === 'pending'
      ? `Status: pending approval${approverName ? ` from ${approverName}` : ''}.`
      : event.status === 'approved'
        ? 'Status: approved (no approver required).'
        : `Status: ${event.status}.`

  return `Done — created a ${typeLabel(event.type)} request${place} for ${person.name}, ${formatWhen(event)}. ${statusLine}`
}

export function formatMultiBookingConfirmation(
  events: ScheduleEvent[],
  people: Person[],
  approverNameFor: (person: Person) => string | null,
): string {
  if (events.length === 0) {
    return 'I couldn’t create those requests — please try again with who, where, and when.'
  }
  if (events.length === 1) {
    const event = events[0]
    const person = people.find((p) => p.id === event.personId) ?? people[0]
    return formatBookingConfirmation(event, person, approverNameFor(person))
  }

  const sample = events[0]
  const place =
    sample.type === 'pto'
      ? ''
      : ` for ${sample.location || COUNTRY_NAMES[sample.countryCode ?? ''] || 'destination'}`
  const when = formatWhen(sample)
  const names = events.map((e) => {
    const person = people.find((p) => p.id === e.personId)
    return person?.name.split(' ')[0] ?? e.personId
  })
  const approved = events.filter((e) => e.status === 'approved')
  const pending = events.filter((e) => e.status === 'pending')

  const nameList =
    names.length > 6
      ? `the whole team (${events.length} people)`
      : names.length === 2
        ? `${names[0]} and ${names[1]}`
        : `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`

  const statusBits: string[] = []
  if (approved.length) {
    const approvedNames = approved.map((e) => {
      const p = people.find((x) => x.id === e.personId)
      return p?.name.split(' ')[0] ?? e.personId
    })
    statusBits.push(
      `${approvedNames.join(', ')}: approved (no approver required)`,
    )
  }
  if (pending.length) {
    const byApprover = new Map<string, string[]>()
    for (const e of pending) {
      const person = people.find((p) => p.id === e.personId)
      const approver = person ? approverNameFor(person) : null
      const key = approver ?? 'approver'
      const list = byApprover.get(key) ?? []
      list.push(person?.name.split(' ')[0] ?? e.personId)
      byApprover.set(key, list)
    }
    for (const [approver, who] of byApprover) {
      statusBits.push(`${who.join(', ')}: pending approval from ${approver}`)
    }
  }

  return `Done — created ${events.length} ${typeLabel(sample.type)} requests${place} for ${nameList}, ${when}. ${statusBits.join('. ')}.`
}
