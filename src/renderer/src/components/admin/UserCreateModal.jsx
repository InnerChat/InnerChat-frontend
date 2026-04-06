import { useState } from 'react'
import Modal from '@ui/Modal'
import Button from '@ui/Button'
import { useAdminStore } from '@stores/adminStore'
import styles from './UserCreateModal.module.css'

export default function UserCreateModal({ onClose }) {
  const createUser = useAdminStore((s) => s.createUser)

  const [form, setForm] = useState({ username: '', email: '', displayName: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await createUser(form)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message ?? '유저 등록에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="유저 등록" onClose={onClose}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          아이디
          <input
            className={styles.input}
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            minLength={3}
            maxLength={50}
            placeholder="3~50자"
          />
        </label>
        <label className={styles.label}>
          이메일
          <input
            className={styles.input}
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>
        <label className={styles.label}>
          표시 이름
          <input
            className={styles.input}
            name="displayName"
            value={form.displayName}
            onChange={handleChange}
            required
            maxLength={100}
          />
        </label>
        <label className={styles.label}>
          초기 비밀번호
          <input
            className={styles.input}
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={8}
            placeholder="8자 이상"
          />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose}>취소</Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? '등록 중...' : '등록'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
