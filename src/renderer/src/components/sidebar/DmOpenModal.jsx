import { useState } from 'react'
import Modal from '@ui/Modal'
import Avatar from '@ui/Avatar'
import Button from '@ui/Button'
import { useChannelStore } from '@stores/channelStore'
import { useAuthStore } from '@stores/authStore'
import styles from './DmOpenModal.module.css'

const COLOR_KEYS = ['green', 'yellow', 'indigo', 'red']
function colorKeyFromId(id) {
  return COLOR_KEYS[Number(id) % COLOR_KEYS.length]
}

export default function DmOpenModal({ onClose }) {
  const members = useChannelStore((s) => s.members)
  const getOrCreateDm = useChannelStore((s) => s.getOrCreateDm)
  const setCurrentChannel = useChannelStore((s) => s.setCurrentChannel)
  const clearUnread = useChannelStore((s) => s.clearUnread)
  const currentUserId = useAuthStore((s) => s.user?.id)

  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const filtered = members.filter(
    (m) =>
      m.userId !== currentUserId &&
      (m.displayName.toLowerCase().includes(query.toLowerCase()) ||
        m.username.toLowerCase().includes(query.toLowerCase()))
  )

  async function handleSelect(targetUserId) {
    setError(null)
    setLoading(true)
    try {
      const channel = await getOrCreateDm(targetUserId)
      setCurrentChannel(channel.id)
      clearUnread(channel.id)
      onClose()
    } catch (e) {
      setError(e.response?.data?.message ?? 'DM 개설에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={true} onClose={onClose}>
      <div className={styles.container}>
        <h2 className={styles.title}>다이렉트 메시지 시작</h2>
        <input
          className={styles.search}
          placeholder="이름 또는 아이디 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div className={styles.list}>
          {filtered.length === 0 && (
            <p className={styles.empty}>검색 결과 없음</p>
          )}
          {filtered.map((m) => (
            <button
              key={m.userId}
              className={styles.userRow}
              onClick={() => handleSelect(m.userId)}
              disabled={loading}
            >
              <Avatar
                size="sm"
                colorKey={colorKeyFromId(m.userId)}
                label={m.displayName?.[0]?.toUpperCase() ?? '?'}
              />
              <div className={styles.userInfo}>
                <span className={styles.displayName}>{m.displayName}</span>
                <span className={styles.username}>@{m.username}</span>
              </div>
            </button>
          ))}
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose}>취소</Button>
        </div>
      </div>
    </Modal>
  )
}
