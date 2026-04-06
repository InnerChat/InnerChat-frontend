import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import Spinner from '@ui/Spinner'
import styles from './OAuthCallbackPage.module.css'

export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const accessToken = params.get('accessToken')
    const refreshToken = params.get('refreshToken')

    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken)
      navigate('/app', { replace: true })
    } else {
      // 토큰 없으면 로그인 페이지로 복귀
      navigate('/', { replace: true })
    }
  }, [])

  return (
    <div className={styles.page}>
      <Spinner size="md" />
      <p className={styles.text}>로그인 중...</p>
    </div>
  )
}
