import { useEffect, useState } from 'react'
import { useAuthStore } from '@stores/authStore'
import Avatar from '@ui/Avatar'
import EditProfileModal from './EditProfileModal'
import styles from './MyProfile.module.css'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export default function MyProfile() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const accessToken = useAuthStore((s) => s.accessToken)
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    if (user || !accessToken) return
    axios
      .get(`${BASE_URL}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      .then(({ data }) => setUser(data))
      .catch(console.error)
  }, [accessToken])

  return (
    <>
      <div className={styles.footer} onClick={() => setEditOpen(true)} title="프로필 편집">
        <Avatar size="md" colorKey="indigo" label={user?.initials ?? '나'} />
        <div className={styles.info}>
          <div className={styles.name}>{user?.displayName ?? '...'}</div>
          <div className={styles.status}>● 온라인</div>
        </div>
        <span className={styles.editIcon}>✎</span>
      </div>
      {editOpen && <EditProfileModal onClose={() => setEditOpen(false)} />}
    </>
  )
}
