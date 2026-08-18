export type ManualSection = {
  id: string
  title: string
  body: string[]
}

export const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: 'overview',
    title: 'What is StanzaWhere?',
    body: [
      'StanzaWhere is the internal calendar for Stanza travel, PTO, and weekly locations.',
      'People are rows on the left. Days are columns. Timezone lanes (PT → CT → ET → WET → CET) show comparable times across offices.',
    ],
  },
  {
    id: 'week-month',
    title: 'Week & month views',
    body: [
      'Use Week for day-by-day detail (events, flights, holidays).',
      'Use Month for a color map of where each person is. Hover a cell for the place name; click to jump into that week.',
      'Weekends are light orange. Local public holidays are light purple.',
    ],
  },
  {
    id: 'requests',
    title: 'Travel, PTO & location requests',
    body: [
      'Click Request to add Travel, PTO, or a week location.',
      'Approval chain: Darwin → Nick; Charlie / Anirban / João → Darwin; everyone else → Charlie. Nick is auto-approved.',
      'Pending items appear dashed until approved in the Approvals tab.',
    ],
  },
  {
    id: 'flights',
    title: 'Import flight confirmations',
    body: [
      'Click Import flight, then drag/drop an .eml/.txt confirmation or paste the email body.',
      'StanzaWhere extracts flight number, route, dates, and dep/arr times.',
      'It creates a travel block plus week location. Flight details show on departure and arrival days.',
    ],
  },
  {
    id: 'edit-delete',
    title: 'Edit, delete & undo',
    body: [
      'Single-click an event chip to open details.',
      'Double-click a chip to delete it (no trash icon). You can also Delete from the detail panel.',
      'Press Cmd+Z (Ctrl+Z) to undo, or Cmd+Shift+Z / Ctrl+Y to redo. Use the Undo button in the top bar too.',
    ],
  },
  {
    id: 'acting-as',
    title: 'Acting as / approvals',
    body: [
      'Use Acting as to switch persona (useful for demos and approvals).',
      'Approvals shows only items waiting on the current persona, plus your own drafts/history.',
    ],
  },
]

export type ChatAction =
  | 'open-manual'
  | 'import-flight'
  | 'new-request'
  | 'week-view'
  | 'month-view'
  | 'approvals'
  | 'undo'

export type ChatReply = {
  text: string
  actions?: { id: ChatAction; label: string }[]
}

export function answerHelpQuery(input: string): ChatReply {
  const q = input.trim().toLowerCase()
  if (!q) {
    return {
      text: 'Ask StanBot anything about StanzaWhere — flights, approvals, week/month view, undo…',
      actions: [
        { id: 'open-manual', label: 'Open manual' },
        { id: 'import-flight', label: 'Import flight' },
      ],
    }
  }

  if (/(manual|help|guide|how (do|to) use|documentation)/.test(q)) {
    return {
      text: 'I opened the topics in the user manual. You can also browse it from the book icon in the top bar.',
      actions: [{ id: 'open-manual', label: 'Open manual' }],
    }
  }

  if (/(flight|email|\.eml|import|confirmation|pnr)/.test(q)) {
    return {
      text: 'To import a flight: Import flight → drop/paste the confirmation email → pick the traveler → Add to calendar. Dep/arr days will show flight number and times.',
      actions: [{ id: 'import-flight', label: 'Import flight' }],
    }
  }

  if (/(approv|darwin|nick|charlie|pending|who approves)/.test(q)) {
    return {
      text: 'Approval chain: Darwin is approved by Nick; Charlie, Anirban, and João by Darwin; everyone else by Charlie. Switch Acting as to the approver, then open Approvals.',
      actions: [{ id: 'approvals', label: 'Open approvals' }],
    }
  }

  if (/(month|color|heatmap|summary)/.test(q)) {
    return {
      text: 'Month view is a place-color map per person. Weekends are orange-tinted; holidays purple. Click a colored cell to open that week.',
      actions: [{ id: 'month-view', label: 'Show month view' }],
    }
  }

  if (/(week|timezone|pt|ct|et|cet|wet)/.test(q)) {
    return {
      text: 'Week view lists people as rows and days as columns, with PT → CT → ET → WET → CET time lanes in the header.',
      actions: [{ id: 'week-view', label: 'Show week view' }],
    }
  }

  if (/(delete|remove|double.?click|undo|redo|cmd\+z|ctrl\+z)/.test(q)) {
    return {
      text: 'Double-click an event to delete it. Single-click opens details. Use Cmd+Z / Ctrl+Z to undo, or the Undo button.',
      actions: [{ id: 'undo', label: 'Undo last change' }],
    }
  }

  if (/(pto|travel|location|request|add)/.test(q)) {
    return {
      text: 'Click Request to add Travel, PTO, or week location — or tell me in chat, e.g. “book a request in two weeks for Japan”. Most people need approval before it locks on the calendar.',
      actions: [{ id: 'new-request', label: 'New request' }],
    }
  }

  if (/(weekend|holiday|orange|purple)/.test(q)) {
    return {
      text: 'Weekends render in light orange. Each person’s local public holidays render in light purple on their row.',
    }
  }

  if (/(hi|hello|hey|thanks|thank you|stanbot)/.test(q)) {
    return {
      text: 'Hi — I’m StanBot. Ask about flights, approvals, month colors, or say “open manual”.',
      actions: [
        { id: 'open-manual', label: 'Open manual' },
        { id: 'import-flight', label: 'Import flight' },
      ],
    }
  }

  return {
    text: 'Not sure I caught that. Try “import flight”, “approvals”, “month view”, “delete”, or open the full manual.',
    actions: [
      { id: 'open-manual', label: 'Open manual' },
      { id: 'import-flight', label: 'Import flight' },
      { id: 'approvals', label: 'Approvals' },
    ],
  }
}
