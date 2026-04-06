import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Button from '@ui/Button'
import { useAuthStore } from '@stores/authStore'
import styles from './LoginPage.module.css'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export default function LoginPage() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const loginAsGuest = useAuthStore((s) => s.loginAsGuest)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleLocalLogin(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data } = await axios.post(`${BASE_URL}/api/v1/auth/login`, { username, password })
      setTokens(data.accessToken, data.refreshToken)
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message ?? '아이디 또는 비밀번호가 올바르지 않습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>memomemo</h1>
        <p className={styles.subtitle}>팀 협업 메신저</p>

        <form onSubmit={handleLocalLogin} className={styles.localForm}>
          <input
            className={styles.input}
            type="text"
            placeholder="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
          <input
            className={styles.input}
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error && <p className={styles.error}>{error}</p>}
          <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        <div className={styles.divider}>
          <span>또는</span>
        </div>

        <div className={styles.buttons}>
          <Button variant="ghost" className={styles.oauthBtn} onClick={() => { loginAsGuest(); navigate('/app', { replace: true }) }}>
            게스트로 시작하기
          </Button>
        </div>
      </div>
    </div>
  )
}
