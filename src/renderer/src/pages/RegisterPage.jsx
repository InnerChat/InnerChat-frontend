import { useState } from 'react'
import axios from 'axios'
import Modal from '@ui/Modal'
import Button from '@ui/Button'
import Spinner from '@ui/Spinner'
import styles from './RegisterPage.module.css'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export default function RegisterPage({ open, onClose, onSuccess }) {
  // 상태
  const [loginId, setLoginId] = useState('')
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // 헬퍼
  function resetForm() {
    setLoginId('')
    setUserName('')
    setPassword('')
    setConfirmPassword('')
    setError(null)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    // validate
    if (!loginId.trim() || !userName.trim() || !password.trim()) {
      setError('아이디, 이름, 비밀번호는 필수입니다.')
      return
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setLoading(true)

    try {
      await axios.post(`${BASE_URL}/api/v1/auth/register`, {
        loginId: loginId.trim(),
        userName: userName.trim(),
        password,
        role: 'ADMIN',
        status: 'ACTIVE'
      })

      resetForm()
      onSuccess()
    } catch (err) {
      const status = err.response?.status
      if (status === 409) {
        setError('이미 사용중인 아이디 입니다.')
      } else if (status === 400) {
        setError(err.response?.data?.message ?? '입력값을 확인해주세요')
      } else {
        setError('회원가입에 실패했습니다. 다시 시도해주세요')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <h2 className={styles.title}>사용자 등록</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>아이디</label>
          <input
            className={styles.input}
            type="text"
            placeholder="로그인에 사용할 아이디"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            autoComplete="username"
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>이름</label>
          <input
            className={styles.input}
            type="text"
            placeholder="표시될 이름"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            autoComplete="name"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>비밀번호</label>
          <input
            className={styles.input}
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>비밀번호 확인</label>
          <input
            className={styles.input}
            type="password"
            placeholder="비밀번호 재입력"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
            취소
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? <Spinner size="sm" /> : '가입하기'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
