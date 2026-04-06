import { useState } from 'react'
import Modal from '@ui/Modal'
import Button from '@ui/Button'
import { useAuthStore } from '@stores/authStore'
import axios from 'axios'
import styles from './EditProfileModal.module.css'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export default function EditProfileModal({ onClose }) {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const setUser = useAuthStore((s) => s.setUser)

  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data } = await axios.put(
        `${BASE_URL}/api/v1/users/me`,
        { displayName, avatarUrl: avatarUrl || null },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      setUser(data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error?.message ?? '프로필 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={true} onClose={onClose}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h3 className={styles.title}>프로필 편집</h3>
        <label className={styles.label}>
          표시 이름
          <input
            className={styles.input}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            maxLength={50}
            placeholder="표시될 이름을 입력하세요"
          />
        </label>
        <label className={styles.label}>
          아바타 URL (선택)
          <input
            className={styles.input}
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            maxLength={500}
            placeholder="https://..."
          />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose}>취소</Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? '저장 중...' : '저장'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
