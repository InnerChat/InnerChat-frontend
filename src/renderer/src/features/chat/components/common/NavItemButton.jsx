/* eslint-disable react/prop-types */
import clsx from 'clsx'
import Avatar from '@ui/Avatar'
import styles from './NavItemButton.module.css'

export default function NavItemButton({
  isActive = false,
  icon,
  avatar,
  label,
  unreadCount,
  showOnline = false,
  onClick
}) {
  return (
    <button
      type="button"
      className={clsx(styles.item, isActive && styles.active)}
      onClick={onClick}
    >
      {avatar ? (
        <Avatar size="sm" colorKey={avatar.colorKey} label={avatar.label} />
      ) : (
        <span className={styles.icon}>{icon}</span>
      )}
      <span className={styles.label}>{label}</span>
      {showOnline ? <span className={styles.onlineDot} /> : null}
      {unreadCount > 0 ? <span className={styles.badge}>{unreadCount}</span> : null}
    </button>
  )
}
