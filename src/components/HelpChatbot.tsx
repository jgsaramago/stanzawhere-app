import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Send, X } from 'lucide-react'
import { answerHelpQuery, type ChatAction } from '../data/manual'
import { approverForPerson } from '../data/seed'
import {
  buildBookingEvents,
  clarifyingQuestion,
  formatMultiBookingConfirmation,
  mergeBookingClarification,
  parseBookingIntent,
  type BookingIntent,
} from '../lib/chatBooking'
import {
  loadChatbotPos,
  saveChatbotPos,
  type ChatbotPos,
} from '../lib/storage'
import type { Person, ScheduleEvent } from '../types'

type Msg = { id: string; role: 'bot' | 'user'; text: string }

const STARTER: Msg = {
  id: 'welcome',
  role: 'bot',
  text: 'Hi — I’m StanBot. Ask about flights, approvals, or week/month view. You can also book travel, PTO, or a week location — e.g. “book a request in two weeks for Japan”.',
}

const FAB = 64
const MARGIN = 12

function defaultPos(): ChatbotPos {
  if (typeof window === 'undefined') return { x: 20, y: 20 }
  return {
    x: Math.max(MARGIN, window.innerWidth - FAB - 20),
    y: Math.max(MARGIN, window.innerHeight - FAB - 20),
  }
}

function clampPos(pos: ChatbotPos): ChatbotPos {
  const maxX = Math.max(MARGIN, window.innerWidth - FAB - MARGIN)
  const maxY = Math.max(MARGIN, window.innerHeight - FAB - MARGIN)
  return {
    x: Math.min(maxX, Math.max(MARGIN, pos.x)),
    y: Math.min(maxY, Math.max(MARGIN, pos.y)),
  }
}

function StanBotLogo({ className }: { className?: string }) {
  return (
    <img
      className={className}
      src="/stanbot-logo.png"
      alt="StanBot"
      width={40}
      height={40}
      draggable={false}
    />
  )
}

export function HelpChatbot({
  onAction,
  people,
  currentUser,
  onCreateEvents,
}: {
  onAction: (action: ChatAction) => void
  people: Person[]
  currentUser: Person
  onCreateEvents: (events: ScheduleEvent[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([STARTER])
  const [suggestions, setSuggestions] = useState(
    answerHelpQuery('').actions ?? [],
  )
  const [pendingBooking, setPendingBooking] = useState<BookingIntent | null>(
    null,
  )
  const [pos, setPos] = useState<ChatbotPos>(() => {
    const saved = loadChatbotPos()
    return saved ? saved : defaultPos()
  })
  const dragRef = useRef<{
    active: boolean
    moved: boolean
    ox: number
    oy: number
    sx: number
    sy: number
  } | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPos((p) => clampPos(p))
  }, [])

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    function onResize() {
      setPos((p) => {
        const next = clampPos(p)
        saveChatbotPos(next)
        return next
      })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const d = dragRef.current
      if (!d?.active) return
      const dx = e.clientX - d.sx
      const dy = e.clientY - d.sy
      if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true
      setPos(clampPos({ x: d.ox + dx, y: d.oy + dy }))
    }
    function onUp() {
      const d = dragRef.current
      if (!d?.active) return
      d.active = false
      setPos((p) => {
        const next = clampPos(p)
        saveChatbotPos(next)
        return next
      })
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  function startDrag(e: ReactPointerEvent) {
    if (e.button !== 0) return
    e.preventDefault()
    dragRef.current = {
      active: true,
      moved: false,
      ox: pos.x,
      oy: pos.y,
      sx: e.clientX,
      sy: e.clientY,
    }
  }

  function tryBooking(trimmed: string): string | null {
    let intent = parseBookingIntent(trimmed, people)
    if (
      pendingBooking &&
      pendingBooking.need !== 'ready' &&
      pendingBooking.need !== 'not-booking'
    ) {
      if (intent.need === 'not-booking') {
        const merged = mergeBookingClarification(pendingBooking, trimmed, people)
        const progressed =
          merged.need === 'ready' ||
          (pendingBooking.need === 'need-destination' &&
            Boolean(merged.location) &&
            !pendingBooking.location) ||
          (pendingBooking.need === 'need-dates' &&
            Boolean(merged.startDate) &&
            merged.startDate !== pendingBooking.startDate)
        if (progressed) intent = merged
      } else if (
        pendingBooking.need === 'need-destination' &&
        intent.location &&
        pendingBooking.startDate
      ) {
        // User answered with a city that also parsed as a booking fragment
        intent = mergeBookingClarification(pendingBooking, trimmed, people)
      }
    }

    if (intent.need === 'not-booking') return null

    if (intent.need !== 'ready') {
      setPendingBooking(intent)
      return clarifyingQuestion(intent, people)
    }

    const events = buildBookingEvents(intent, currentUser, people)
    if (events.length === 0) {
      setPendingBooking(intent)
      return clarifyingQuestion(
        { ...intent, need: 'need-dates' },
        people,
      )
    }

    onCreateEvents(events)
    setPendingBooking(null)
    return formatMultiBookingConfirmation(events, people, (person) => {
      const approver = approverForPerson(person)
      return approver?.name ?? null
    })
  }

  function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    const userMsg: Msg = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: trimmed,
    }

    const bookingReply = tryBooking(trimmed)
    if (bookingReply) {
      const botMsg: Msg = {
        id: `b_${Date.now()}`,
        role: 'bot',
        text: bookingReply,
      }
      setMessages((m) => [...m, userMsg, botMsg])
      setSuggestions([{ id: 'approvals', label: 'Open approvals' }])
      setInput('')
      return
    }

    const reply = answerHelpQuery(trimmed)
    const botMsg: Msg = {
      id: `b_${Date.now()}`,
      role: 'bot',
      text: reply.text,
    }
    setMessages((m) => [...m, userMsg, botMsg])
    setSuggestions(reply.actions ?? [])
    setInput('')

    if (/(open manual|show manual|user manual)/i.test(trimmed)) {
      onAction('open-manual')
    }
  }

  return (
    <>
      {open && (
        <div className="chatbot-panel" role="dialog" aria-label="StanBot">
          <header className="chatbot-header">
            <div className="chatbot-brand">
              <StanBotLogo className="stanbot-avatar" />
              <div>
                <strong>StanBot</strong>
                <span>Your StanzaWhere guide</span>
              </div>
            </div>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setOpen(false)}
              aria-label="Close StanBot"
            >
              <X size={16} />
            </button>
          </header>

          <div className="chatbot-messages">
            {messages.map((m) => (
              <div key={m.id} className={`chat-row ${m.role}`}>
                {m.role === 'bot' && (
                  <StanBotLogo className="stanbot-avatar sm" />
                )}
                <div className={`chat-bubble ${m.role}`}>{m.text}</div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {suggestions.length > 0 && (
            <div className="chatbot-suggestions">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="chip chip-location"
                  onClick={() => {
                    onAction(s.id)
                    setMessages((m) => [
                      ...m,
                      {
                        id: `a_${Date.now()}`,
                        role: 'bot',
                        text: `Opening “${s.label}” for you.`,
                      },
                    ])
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          <form
            className="chatbot-input"
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Book travel, ask about approvals…"
              aria-label="Message StanBot"
            />
            <button type="submit" className="btn primary" aria-label="Send">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {!open && (
        <button
          type="button"
          className="chatbot-fab"
          style={{ left: pos.x, top: pos.y }}
          onPointerDown={startDrag}
          onClick={() => {
            if (dragRef.current?.moved) return
            setOpen(true)
          }}
          aria-label="Open StanBot"
          title="StanBot — drag to move"
        >
          <img
            src="/stanbot-logo.png"
            alt=""
            className="stanbot-fab-img"
            draggable={false}
          />
        </button>
      )}
    </>
  )
}
