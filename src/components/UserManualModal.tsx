import { BookOpen, X } from 'lucide-react'
import { MANUAL_SECTIONS } from '../data/manual'

export function UserManualModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal manual-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <p className="eyebrow">Guide</p>
            <h2>
              <BookOpen size={22} className="inline-icon" /> User manual
            </h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="manual-body">
          {MANUAL_SECTIONS.map((section) => (
            <section key={section.id} id={`manual-${section.id}`}>
              <h3>{section.title}</h3>
              {section.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </section>
          ))}
        </div>

        <footer className="modal-footer">
          <button type="button" className="btn primary" onClick={onClose}>
            Got it
          </button>
        </footer>
      </div>
    </div>
  )
}
