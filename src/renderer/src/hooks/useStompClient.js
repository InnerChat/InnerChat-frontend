import { useEffect, useRef, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '@stores/authStore'

const WS_URL = import.meta.env.VITE_WS_URL

export default function useStompClient() {
  const clientRef = useRef(null)
  const accessToken = useAuthStore((s) => s.accessToken)
  const logout = useAuthStore((s) => s.logout)

  const connect = useCallback((token) => {
    if (clientRef.current?.active) return

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      onConnect: () => {
        // 강제 로그아웃 구독 (중복 로그인 시 수신)
        client.subscribe('/user/queue/force-logout', () => {
          logout()
        })

        // 유저 상태 변경 구독
        client.subscribe('/topic/status', (message) => {
          const { userId, status } = JSON.parse(message.body)
          // TODO: 유저 상태 store 업데이트
          console.log(`userId=${userId} status=${status}`)
        })
      },

      onStompError: (frame) => {
        console.error('STOMP error', frame)
      }
    })

    client.activate()
    clientRef.current = client
  }, [logout])

  const disconnect = useCallback(() => {
    if (clientRef.current?.active) {
      clientRef.current.deactivate()
      clientRef.current = null
    }
  }, [])

  // accessToken 변경 감지: 로그인 → 연결 / 로그아웃 또는 토큰 갱신 → 재연결
  useEffect(() => {
    if (accessToken) {
      disconnect()          // 기존 연결 정리 후
      connect(accessToken)  // 새 토큰으로 재연결
    } else {
      disconnect()
    }
    return () => disconnect()
  }, [accessToken])

  return clientRef
}