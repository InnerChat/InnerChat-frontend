import clsx from 'clsx'
import Avatar from '@ui/Avatar'
import styles from './DmItem.module.css'

export default function DmItem({ user, isActive, onClick }) {
  return (
    <div className={clsx(styles.item, isActive && styles.active)} onClick={onClick}>
      <Avatar size="sm" colorKey={user.colorKey ?? 'indigo'} label={user.initials ?? '?'} />
      <span className={styles.name}>{user.displayName}</span>
      {user.online && <div className={styles.dot} />}
    </div>
  )
}
