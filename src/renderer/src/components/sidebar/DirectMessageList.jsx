import { useEffect, useState } from 'react'
import { useChannelStore } from '@stores/channelStore'
import { useAuthStore } from '@stores/authStore'
import DmItem from './DmItem'
import DmOpenModal from './DmOpenModal'
import styles from './DirectMessageList.module.css'

const COLOR_KEYS = ['green', 'yellow', 'indigo', 'red']

function colorKeyFromId(id) {
  return COLOR_KEYS[Number(id) % COLOR_KEYS.length]
}

function getDmPartner(channel, members, currentUserId) {
  const match = channel.name.match(/^dm-(\d+)-(\d+)$/)
  if (!match) return null
  const idA = Number(match[1]), idB = Number(match[2])
  const partnerId = idA === currentUserId ? idB : idA
  return members.find((m) => m.userId === partnerId) ?? null
}

export default function DirectMessageList() {
  const channels = useChannelStore((s) => s.channels)
  const members = useChannelStore((s) => s.members)
  const fetchMembers = useChannelStore((s) => s.fetchMembers)
  const setCurrentChannel = useChannelStore((s) => s.setCurrentChannel)
  const clearUnread = useChannelStore((s) => s.clearUnread)
  const currentChannelId = useChannelStore((s) => s.currentChannelId)
  const currentUserId = useAuthStore((s) => s.user?.id)

  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [])

  const dmChannels = channels.filter((ch) => ch.isDirect)

  function handleClick(channelId) {
    setCurrentChannel(channelId)
    clearUnread(channelId)
  }

  return (
    <div className={styles.section}>
      <div className={styles.label}>Direct</div>
      {dmChannels.map((ch) => {
        const partner = getDmPartner(ch, members, currentUserId)
        const user = partner
          ? {
              userId: partner.userId,
              displayName: partner.displayName,
              initials: partner.displayName?.[0]?.toUpperCase() ?? '?',
              colorKey: colorKeyFromId(partner.userId),
            }
          : {
              userId: ch.id,
              displayName: ch.name,
              initials: '?',
              colorKey: 'indigo',
            }
        return (
          <DmItem
            key={ch.id}
            user={user}
            isActive={ch.id === currentChannelId}
            onClick={() => handleClick(ch.id)}
          />
        )
      })}
      <div className={styles.add} onClick={() => setShowModal(true)}>
        <span>+</span> 다이렉트 메시지
      </div>
      {showModal && <DmOpenModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
