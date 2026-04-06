import { useEffect, useRef } from 'react'
import { useAuthStore } from '@stores/authStore'

const REFRESH_BEFORE_MS = 60 * 1000       // 만료 1분 전
const TOKEN_LIFETIME_MS = 15 * 60 * 1000  // 액세스 토큰 수명 15분

/**
 * 액세스 토큰 만료 1분 전 자동 갱신 훅.
 * onRefreshed 콜백으로 STOMP 재연결을 트리거한다.
 *
 * @param {{ onRefreshed?: () => void }} options
 */
export function useTokenRefresh({ onRefreshed } = {}) {
  const timerRef = useRef(null)
  const accessToken = useAuthStore((s) => s.accessToken)
  const _refresh = useAuthStore((s) => s._refresh)

  useEffect(() => {
    if (!accessToken) return

    const delay = TOKEN_LIFETIME_MS - REFRESH_BEFORE_MS

    timerRef.current = setTimeout(async () => {
      await _refresh()
      onRefreshed?.()
    }, delay)

    return () => clearTimeout(timerRef.current)
  }, [accessToken])
}
