import { useEffect } from 'react'
import styles from './Modal.module.css'

/**
 * @param {boolean} open
 * @param {() => void} onClose
 */
export default function Modal({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div className={styles.card} onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
