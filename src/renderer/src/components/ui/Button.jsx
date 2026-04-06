import clsx from 'clsx'
import styles from './Button.module.css'

/**
 * @param {'primary'|'ghost'|'icon'|'tool'} variant
 */
export default function Button({ variant = 'primary', className, children, ...props }) {
  return (
    <button className={clsx(styles.btn, styles[variant], className)} {...props}>
      {children}
    </button>
  )
}
