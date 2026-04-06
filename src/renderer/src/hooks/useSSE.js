import { useEffect, useRef } from 'react'
import { useAuthStore } from '@stores/authStore'
import { useChannelStore } from '@stores/channelStore'
import { useNotificationStore } from '@stores/notificationStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

/**
 * SSE 알림 스트림 훅.
 * - /api/v1/notifications/stream 에 연결
 * - MESSAGE / THREAD_REPLY / MENTION 이벤트 수신
 * - toast 알림 + Electron 네이티브 알림 표시
 */
export function useSSE() {
  const sourceRef = useRef(null)
  const accessToken = useAuthStore((s) => s.accessToken)
  const push = useNotificationStore((s) => s.push)

  useEffect(() => {
    if (!accessToken) return

    // EventSource는 커스텀 헤더를 지원하지 않으므로 쿼리 파라미터로 토큰 전달
    const url = `${BASE_URL}/api/v1/notifications/stream?token=${encodeURIComponent(accessToken)}`
    const source = new EventSource(url)
    sourceRef.current = source

    function handleEvent(e) {
      try {
        const event = JSON.parse(e.data)
        const currentChannelId = useChannelStore.getState().currentChannelId

        // 현재 보고 있는 채널이면 알림 표시 안 함
        if (event.channelId === currentChannelId) return

        const message = `${event.displayName}: ${truncate(event.content, 50)}`

        // toast 알림
        push({
          type: event.type,
          message,
          channelId: event.channelId
        })

        // Electron 네이티브 알림
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('memomemo', { body: message })
        }
      } catch (err) {
        console.error('SSE 이벤트 파싱 실패', err)
      }
    }

    source.addEventListener('MESSAGE', handleEvent)
    source.addEventListener('THREAD_REPLY', handleEvent)
    source.addEventListener('MENTION', handleEvent)

    source.onerror = () => {
      source.close()
      // 5초 후 재연결 시도
      setTimeout(() => {
        if (useAuthStore.getState().accessToken) {
          sourceRef.current = null
        }
      }, 5000)
    }

    return () => {
      source.close()
      sourceRef.current = null
    }
  }, [accessToken])
}

function truncate(str, max) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}
