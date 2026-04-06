import { useNotificationStore } from '@stores/notificationStore'
import styles from './ToastList.module.css'

const TYPE_ICON = {
  MESSAGE: '💬',
  THREAD_REPLY: '🧵',
  MENTION: '@',
  ERROR: '⚠️'
}

export default function ToastList() {
  const notifications = useNotificationStore((s) => s.notifications)
  const dismiss = useNotificationStore((s) => s.dismiss)

  if (notifications.length === 0) return null

  return (
    <div className={styles.container}>
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`${styles.toast} ${n.type === 'ERROR' ? styles.error : styles.info}`}
        >
          <span className={styles.icon}>{TYPE_ICON[n.type] ?? '🔔'}</span>
          <span className={styles.message}>{n.message}</span>
          <button className={styles.close} onClick={() => dismiss(n.id)}>✕</button>
        </div>
      ))}
    </div>
  )
}
