import { useEffect, useRef } from 'react'

/**
 * Modal dialog for choosing a pawn promotion piece.
 * Replaces the old window.prompt() call.
 *
 * Props:
 *   open      – boolean, whether the modal is visible
 *   color     – 'w' | 'b', the color of the promoting pawn
 *   onChoose  – (piece: 'q'|'r'|'b'|'n') => void
 *   onCancel  – () => void  (user dismissed without choosing)
 *   t         – translation object (needs .promotionTitle, .promotionCancel)
 */

const PIECES = [
  { value: 'q', labelEn: 'Queen',  symbol: { w: '♕', b: '♛' } },
  { value: 'r', labelEn: 'Rook',   symbol: { w: '♖', b: '♜' } },
  { value: 'b', labelEn: 'Bishop', symbol: { w: '♗', b: '♝' } },
  { value: 'n', labelEn: 'Knight', symbol: { w: '♘', b: '♞' } },
]

export function PromotionModal({ open, color, onChoose, onCancel, t }) {
  const dialogRef = useRef(null)

  // Trap focus inside the dialog when open.
  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus()
    }
  }, [open])

  // Close on Escape key.
  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  const pieceColor = color || 'w'

  return (
    <div
      className="promotion-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t.promotionTitle}
      ref={dialogRef}
      tabIndex={-1}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="promotion-dialog">
        <p className="promotion-label">{t.promotionTitle}</p>
        <div className="promotion-choices">
          {PIECES.map(({ value, labelEn, symbol }) => (
            <button
              key={value}
              type="button"
              className="promotion-piece-btn"
              aria-label={labelEn}
              onClick={() => onChoose(value)}
            >
              <span className="promotion-symbol" aria-hidden="true">
                {symbol[pieceColor]}
              </span>
              <span className="promotion-piece-name">{labelEn}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="promotion-cancel-btn"
          onClick={onCancel}
        >
          {t.promotionCancel}
        </button>
      </div>
    </div>
  )
}
