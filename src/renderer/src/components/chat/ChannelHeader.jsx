import { useChannelStore } from '@stores/channelStore'
import { useAuthStore } from '@stores/authStore'
import Button from '@ui/Button'
import Tooltip from '@ui/Tooltip'
import styles from './ChannelHeader.module.css'

function getDmPartnerName(channel, members, currentUserId) {
  const match = channel.name.match(/^dm-(\d+)-(\d+)$/)
  if (!match) return channel.name
  const idA = Number(match[1]), idB = Number(match[2])
  const partnerId = idA === currentUserId ? idB : idA
  const partner = members.find((m) => m.userId === partnerId)
  return partner?.displayName ?? channel.name
}

export default function ChannelHeader({ onPinClick, onMemberClick, onSearchClick }) {
  const channels = useChannelStore((s) => s.channels)
  const members = useChannelStore((s) => s.members)
  const currentChannelId = useChannelStore((s) => s.currentChannelId)
  const currentUserId = useAuthStore((s) => s.user?.id)
  const channel = channels.find((c) => c.id === currentChannelId)

  if (!channel) return <div className={styles.header} />

  const isDm = channel.isDirect
  const title = isDm
    ? getDmPartnerName(channel, members, currentUserId)
    : channel.name

  return (
    <div className={styles.header}>
      <span className={styles.hash}>{isDm ? '@' : '#'}</span>
      <span className={styles.title}>{title}</span>
      {!isDm && channel.description && (
        <span className={styles.desc}>{channel.description}</span>
      )}
      <div className={styles.actions}>
        {!isDm && (
          <>
            <Tooltip text="검색">
              <Button variant="icon" onClick={onSearchClick}>🔍</Button>
            </Tooltip>
            <Tooltip text="핀">
              <Button variant="icon" onClick={onPinClick}>📌</Button>
            </Tooltip>
            <Tooltip text="멤버">
              <Button variant="icon" onClick={onMemberClick}>👥</Button>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  )
}
