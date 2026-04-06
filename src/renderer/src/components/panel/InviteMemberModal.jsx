import { useEffect, useState } from 'react'
import Modal from '@ui/Modal'
import Button from '@ui/Button'
import Avatar from '@ui/Avatar'
import { useChannelStore } from '@stores/channelStore'
import { useAuthStore } from '@stores/authStore'
import axios from 'axios'
import styles from './InviteMemberModal.module.css'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export default function InviteMemberModal({ onClose }) {
  const members = useChannelStore((s) => s.members)
  const inviteMember = useChannelStore((s) => s.inviteMember)
  const accessToken = useAuthStore((s) => s.accessToken)

  const [allUsers, setAllUsers] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios
      .get(`${BASE_URL}/api/v1/users`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      .then(({ data }) => setAllUsers(data))
      .catch(console.error)
  }, [])

  const memberIds = new Set(members.map((m) => m.userId))
  const candidates = allUsers
    .filter((u) => !memberIds.has(u.userId))
    .filter((u) =>
      query === '' ||
      u.displayName?.toLowerCase().includes(query.toLowerCase()) ||
      u.username?.toLowerCase().includes(query.toLowerCase())
    )

  async function handleInvite(userId) {
    setError(null)
    setLoading(true)
    try {
      await inviteMember(userId)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error?.message ?? '초대에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={true} onClose={onClose}>
      <div className={styles.container}>
        <h3 className={styles.title}>멤버 초대</h3>
        <input
          className={styles.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름으로 검색..."
          autoFocus
        />
        <div className={styles.list}>
          {candidates.length === 0 && (
            <p className={styles.empty}>초대할 수 있는 멤버가 없습니다.</p>
          )}
          {candidates.map((u) => (
            <div key={u.userId} className={styles.item}>
              <Avatar size="sm" colorKey={u.colorKey ?? 'indigo'} label={u.initials} />
              <span className={styles.name}>{u.displayName}</span>
              <Button
                variant="ghost"
                disabled={loading}
                onClick={() => handleInvite(u.userId)}
                className={styles.inviteBtn}
              >
                초대
              </Button>
            </div>
          ))}
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose}>닫기</Button>
        </div>
      </div>
    </Modal>
  )
}
