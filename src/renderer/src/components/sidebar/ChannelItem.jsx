import clsx from 'clsx'
import Badge from '@ui/Badge'
import styles from './ChannelItem.module.css'

export default function ChannelItem({ channel, isActive, onClick }) {
  return (
    <div
      className={clsx(styles.item, isActive && styles.active)}
      onClick={() => onClick(channel.id)}
    >
      <span className={styles.icon}>#</span>
      <span className={styles.name}>{channel.name}</span>
      {!isActive && channel.unreadCount > 0 && (
        <Badge variant="danger">{channel.unreadCount}</Badge>
      )}
    </div>
  )
}
