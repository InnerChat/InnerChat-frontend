import { useEffect, useState } from 'react'
import { useChannelStore } from '@stores/channelStore'
import { useAuthStore } from '@stores/authStore'
import axios from 'axios'
import styles from './PinnedMessages.module.css'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export default function PinnedMessages() {
  const currentChannelId = useChannelStore((s) => s.currentChannelId)
  const accessToken = useAuthStore((s) => s.accessToken)
  const [pins, setPins] = useState([])

  useEffect(() => {
    if (!currentChannelId) return
    axios
      .get(`${BASE_URL}/api/v1/channels/${currentChannelId}/pins`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      .then(({ data }) => setPins(data))
      .catch(console.error)
  }, [currentChannelId])

  async function handleUnpin(messageId) {
    // 낙관적 업데이트
    setPins((prev) => prev.filter((p) => p.messageId !== messageId))
    try {
      await axios.delete(
        `${BASE_URL}/api/v1/messages/${messageId}/pin?channelId=${currentChannelId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
    } catch {
      // 실패 시 재조회
      axios
        .get(`${BASE_URL}/api/v1/channels/${currentChannelId}/pins`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        .then(({ data }) => setPins(data))
    }
  }

  return (
    <div>
      <div className={styles.sectionLabel}>📌 핀된 메시지</div>
      {pins.length === 0 && (
        <p className={styles.empty}>핀된 메시지가 없습니다.</p>
      )}
      {pins.map((pin) => (
        <div key={pin.messageId} className={styles.item}>
          <div className={styles.itemTitle}>
            <span>{pin.displayName ?? '알 수 없음'}</span>
            <button className={styles.unpin} onClick={() => handleUnpin(pin.messageId)}>✕</button>
          </div>
          <div className={styles.itemText}>{pin.content}</div>
        </div>
      ))}
    </div>
  )
}
