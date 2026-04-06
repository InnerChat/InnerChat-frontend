import clsx from 'clsx'
import styles from './ScrollArea.module.css'

export default function ScrollArea({ className, children }) {
  return (
    <div className={clsx(styles.scroll, className)}>
      {children}
    </div>
  )
}
