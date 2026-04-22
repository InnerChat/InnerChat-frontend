import { useCallback, useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '@stores/authStore'

const WS_URL = import.meta.env.VITE_WS_URL

export default function useStompClient() {
  const clientRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const accessToken = useAuthStore((s) => s.accessToken)
  const logout = useAuthStore((s) => s.logout)

  const connect = useCallback(
    (token) => {
      if (!token || clientRef.current?.active) {
        return
      }

      const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: () => {
          setIsConnected(true)

          client.subscribe('/user/queue/force-logout', () => {
            logout()
          })

          client.subscribe('/topic/status', (message) => {
            const { userId, status } = JSON.parse(message.body)
            console.log(`userId=${userId} status=${status}`)
          })
        },
        onDisconnect: () => {
          setIsConnected(false)
        },
        onWebSocketClose: () => {
          setIsConnected(false)
        },
        onStompError: (frame) => {
          console.error('STOMP error', frame)
        }
      })

      client.activate()
      clientRef.current = client
    },
    [logout]
  )

  const disconnect = useCallback(() => {
    if (clientRef.current?.active) {
      clientRef.current.deactivate()
    }

    clientRef.current = null
    setIsConnected(false)
  }, [])

  useEffect(() => {
    if (accessToken) {
      disconnect()
      connect(accessToken)
      return () => disconnect()
    }

    disconnect()
    return undefined
  }, [accessToken, connect, disconnect])

  return { clientRef, isConnected }
}
