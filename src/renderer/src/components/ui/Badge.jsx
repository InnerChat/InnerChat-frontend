import clsx from 'clsx'
import styles from './Badge.module.css'

/**
 * @param {'danger'|'info'} variant
 * @param {string|number} children
 */
export default function Badge({ variant = 'danger', children }) {
  return (
    <span className={clsx(styles.badge, styles[variant])}>
      {children}
    </span>
  )
}
