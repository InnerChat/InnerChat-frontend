import { useEffect, useState } from 'react'
import { useAuthStore } from '@stores/authStore'
import Modal from '@ui/Modal'
import Avatar from '@ui/Avatar'
import Spinner from '@ui/Spinner'
import axios from 'axios'
import styles from './UserProfileModal.module.css'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export default function UserProfileModal({ userId, onClose }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    axios
      .get(`${BASE_URL}/api/v1/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      .then(({ data }) => setUser(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [userId])

  return (
    <Modal open={!!userId} onClose={onClose}>
      {loading || !user ? (
        <div className={styles.loading}><Spinner /></div>
      ) : (
        <div className={styles.content}>
          <Avatar size="lg" colorKey={user.colorKey ?? 'indigo'} label={user.initials} />
          <div className={styles.info}>
            <div className={styles.name}>{user.displayName}</div>
            <div className={styles.username}>@{user.username}</div>
            {user.role && <div className={styles.role}>{user.role}</div>}
          </div>
          <div className={styles.status}>
            {user.online
              ? <span className={styles.online}>● 온라인</span>
              : <span className={styles.offline}>● 오프라인</span>}
          </div>
        </div>
      )}
    </Modal>
  )
}
