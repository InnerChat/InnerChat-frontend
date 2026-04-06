import { useEffect, useState } from 'react'
import { useChannelStore } from '@stores/channelStore'
import ChannelItem from './ChannelItem'
import ChannelCreateModal from './ChannelCreateModal'
import styles from './ChannelList.module.css'

export default function ChannelList() {
  const channels = useChannelStore((s) => s.channels)
  const currentChannelId = useChannelStore((s) => s.currentChannelId)
  const fetchChannels = useChannelStore((s) => s.fetchChannels)
  const setCurrentChannel = useChannelStore((s) => s.setCurrentChannel)
  const clearUnread = useChannelStore((s) => s.clearUnread)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchChannels()
  }, [])

  function handleClick(channelId) {
    setCurrentChannel(channelId)
    clearUnread(channelId)
  }

  const normalChannels = channels.filter((ch) => !ch.isDirect)

  return (
    <div className={styles.section}>
      <div className={styles.label}>Channels</div>
      {normalChannels.map((ch) => (
        <ChannelItem
          key={ch.id}
          channel={ch}
          isActive={ch.id === currentChannelId}
          onClick={handleClick}
        />
      ))}
      <div className={styles.add} onClick={() => setShowModal(true)}>
        <span>+</span> 채널 추가
      </div>
      {showModal && <ChannelCreateModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
