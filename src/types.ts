export type EventType = 'travel' | 'pto' | 'location'
export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected'
export type UserRole = 'member' | 'manager'

export type DressCode =
  | 'formal'
  | 'business'
  | 'smart-business'
  | 'business-casual'
  | 'casual'
  | 'sporty'

export const DRESS_CODES: {
  id: DressCode
  label: string
  hint: string
}[] = [
  {
    id: 'formal',
    label: 'Formal',
    hint: 'Gala events — smoking / black tie & gala dress',
  },
  {
    id: 'business',
    label: 'Business',
    hint: 'Suit and tie',
  },
  {
    id: 'smart-business',
    label: 'Smart business',
    hint: 'Suit but no tie',
  },
  {
    id: 'business-casual',
    label: 'Business casual',
    hint: 'Chinos and shirt',
  },
  {
    id: 'casual',
    label: 'Casual',
    hint: 'Fashion / everyday casual',
  },
  {
    id: 'sporty',
    label: 'Sporty',
    hint: 'Activewear / athletic',
  },
]

export interface Person {
  id: string
  name: string
  email: string
  role: UserRole
  title: string
  homeCity: string
  homeCountry: string
  timezone: string
  avatarColor: string
  /** Path under /public or data URL from profile upload */
  avatarUrl?: string
  /**
   * Who must approve this person's requests.
   * null = auto-approved (CEO).
   */
  approverId: string | null
  /** Editable profile fields */
  bio?: string
  phone?: string
  slack?: string
  workingHours?: string
}

export interface FlightSegment {
  flightNumber: string
  fromCode?: string
  toCode?: string
  fromCity?: string
  toCity?: string
  /** YYYY-MM-DD */
  date: string
  departTime?: string
  arriveTime?: string
  role: 'departure' | 'arrival' | 'connection'
}

export interface ScheduleEvent {
  id: string
  personId: string
  type: EventType
  title: string
  startDate: string
  endDate: string
  location?: string
  countryCode?: string
  notes?: string
  /** Optional attire expectation for the trip / onsite */
  dressCode?: DressCode
  status: ApprovalStatus
  requestedBy: string
  /** Approver assigned at submit time */
  approverId?: string | null
  reviewedBy?: string
  reviewNote?: string
  createdAt: string
  updatedAt: string
  /** Parsed from flight confirmation emails */
  flights?: FlightSegment[]
}

export interface Holiday {
  date: string
  name: string
  countryCode: string
}

export interface TimezoneLane {
  id: string
  label: string
  city: string
  timezone: string
}

export interface AppState {
  people: Person[]
  events: ScheduleEvent[]
  currentUserId: string
}

export interface ParsedFlightEmail {
  airline?: string
  confirmation?: string
  destinationCity?: string
  destinationCountry?: string
  startDate?: string
  endDate?: string
  flights: FlightSegment[]
  rawSnippet: string
}
