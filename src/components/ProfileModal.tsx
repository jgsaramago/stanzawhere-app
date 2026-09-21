import { useState } from 'react'
import { X } from 'lucide-react'
import { COUNTRY_OPTIONS } from '../data/seed'
import type { Person } from '../types'

const TIMEZONES = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
]

export function ProfileModal({
  person,
  onClose,
  onSave,
  readOnly = false,
}: {
  person: Person
  onClose: () => void
  onSave: (person: Person) => void
  readOnly?: boolean
}) {
  const [draft, setDraft] = useState<Person>({ ...person })

  function set<K extends keyof Person>(key: K, value: Person[K]) {
    if (readOnly) return
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function onAvatarFile(file: File | null) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') set('avatarUrl', reader.result)
    }
    reader.readAsDataURL(file)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (readOnly) {
      onClose()
      return
    }
    onSave(draft)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal profile-modal"
        onClick={(ev) => ev.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">{readOnly ? 'Profile (view only)' : 'Profile'}</p>
            <h2>{person.name}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <fieldset disabled={readOnly} className="profile-fields">
          <div className="profile-avatar-row">
            {draft.avatarUrl ? (
              <img className="avatar lg" src={draft.avatarUrl} alt="" />
            ) : (
              <div className="avatar lg" style={{ background: draft.avatarColor }}>
                {draft.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)}
              </div>
            )}
            {!readOnly && (
              <label className="btn ghost">
                Upload photo
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => onAvatarFile(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>

          <div className="form-grid">
            <label>
              Name
              <input
                value={draft.name}
                onChange={(e) => set('name', e.target.value)}
                required
              />
            </label>
            <label>
              Title
              <input
                value={draft.title}
                onChange={(e) => set('title', e.target.value)}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={draft.email}
                onChange={(e) => set('email', e.target.value)}
                required
              />
            </label>
            <label>
              Phone
              <input
                value={draft.phone ?? ''}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+1 …"
              />
            </label>
            <label>
              Home city
              <input
                value={draft.homeCity}
                onChange={(e) => set('homeCity', e.target.value)}
                required
              />
            </label>
            <label>
              Country
              <select
                value={draft.homeCountry}
                onChange={(e) => set('homeCountry', e.target.value)}
              >
                {COUNTRY_OPTIONS.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="span-2">
              Timezone
              <select
                value={draft.timezone}
                onChange={(e) => set('timezone', e.target.value)}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Slack
              <input
                value={draft.slack ?? ''}
                onChange={(e) => set('slack', e.target.value)}
                placeholder="@handle"
              />
            </label>
            <label>
              Working hours
              <input
                value={draft.workingHours ?? ''}
                onChange={(e) => set('workingHours', e.target.value)}
                placeholder="9:00–17:00 local"
              />
            </label>
            <label className="span-2">
              Bio
              <textarea
                rows={3}
                value={draft.bio ?? ''}
                onChange={(e) => set('bio', e.target.value)}
                placeholder="Short note for teammates"
              />
            </label>
            <p className="approver-hint span-2">
              Role & approval chain stay managed by Stanza org settings (
              {draft.role}
              {draft.approverId ? ` · approver: ${draft.approverId}` : ' · auto-approved'}
              ).
            </p>
          </div>
        </fieldset>

        <footer className="modal-footer">
          <button type="button" className="btn ghost" onClick={onClose}>
            {readOnly ? 'Close' : 'Cancel'}
          </button>
          {!readOnly && (
            <button type="submit" className="btn primary">
              Save profile
            </button>
          )}
        </footer>
      </form>
    </div>
  )
}
