import { useEffect, useState } from 'react'
import { useAdminStore } from '@stores/adminStore'
import { useAuthStore } from '@stores/authStore'
import Button from '@ui/Button'
import UserCreateModal from '@/components/admin/UserCreateModal'
import styles from './AdminPage.module.css'

export default function AdminPage() {
  const { users, loading, error, fetchUsers, deactivateUser } = useAdminStore()
  const logout = useAuthStore((s) => s.logout)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>관리자 — 유저 관리</h1>
        <div className={styles.headerActions}>
          <Button variant="primary" onClick={() => setShowModal(true)}>+ 유저 등록</Button>
          <Button variant="ghost" onClick={logout}>로그아웃</Button>
        </div>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.empty}>불러오는 중...</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>아이디</th>
              <th>이메일</th>
              <th>표시 이름</th>
              <th>역할</th>
              <th>상태</th>
              <th>가입일</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className={!user.isActive ? styles.inactive : ''}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.displayName}</td>
                <td>
                  <span className={user.role === 'ADMIN' ? styles.badgeAdmin : styles.badgeUser}>
                    {user.role}
                  </span>
                </td>
                <td>{user.isActive ? '활성' : '비활성'}</td>
                <td>{new Date(user.createdAt).toLocaleDateString('ko-KR')}</td>
                <td>
                  {user.isActive && user.role !== 'ADMIN' && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`${user.username} 을(를) 비활성화하시겠습니까?`)) {
                          deactivateUser(user.id)
                        }
                      }}
                    >
                      비활성화
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {!users.length && (
              <tr>
                <td colSpan={7} className={styles.empty}>등록된 유저가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showModal && <UserCreateModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
