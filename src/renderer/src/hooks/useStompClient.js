import { useEffect, useRef, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '@stores/authStore'
import { useMessageStore } from '@stores/messageStore'
import { useChannelStore } from '@stores/channelStore'
import { useStompStore } from '@stores/stompStore'
import { useNotificationStore } from '@stores/notificationStore'
import { useTokenRefresh } from './useTokenRefresh'

const WS_URL = import.meta.env.VITE_API_BASE_URL

/**
 * STOMP 클라이언트 훅.
 * - /ws 엔드포인트 연결
 * - 현재 채널 구독: /topic/channel/{channelId}
 * - 메시지 전송: /app/channel/{channelId}/send
 * - 스레드 전송: /app/channel/{channelId}/thread/{parentId}/send
 * - 토큰 갱신 시 재연결
 */
export function useStompClient() {
  const clientRef = useRef(null)
  const subscriptionRef = useRef(null)
  const errorSubRef = useRef(null)
  const currentChannelId = useChannelStore((s) => s.currentChannelId)
  const accessToken = useAuthStore((s) => s.accessToken)
  const handleStompEvent = useMessageStore((s) => s.handleStompEvent)
  const incrementUnread = useChannelStore((s) => s.incrementUnread)
  const registerStomp = useStompStore((s) => s.register)
  const pushNotification = useNotificationStore((s) => s.push)

  // 채널 구독 (이전 구독 해제 후 재구독)
  function subscribeChannel(client, channelId) {
    if (!channelId) return
    subscriptionRef.current?.unsubscribe()
    subscriptionRef.current = client.subscribe(`/topic/channel/${channelId}`, (message) => {
      const event = JSON.parse(message.body)
      handleStompEvent(event)

      // 현재 보고 있는 채널이 아니면 미읽음 증가
      const current = useChannelStore.getState().currentChannelId
      if (event.channelId !== current) {
        incrementUnread(event.channelId)
      }
    })
  }

  const connect = useCallback(() => {
    const token = useAuthStore.getState().accessToken
    if (!token) return

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,
      onConnect: () => {
        subscribeChannel(client, useChannelStore.getState().currentChannelId)

        // 서버 측 STOMP 에러 수신 (/user/queue/errors)
        // 백엔드 @MessageExceptionHandler → plain string 반환
        errorSubRef.current = client.subscribe('/user/queue/errors', (frame) => {
          const message = frame.body ?? '메시지 처리 중 오류가 발생했습니다.'
          useNotificationStore.getState().push({ type: 'ERROR', message })
        })
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame)
      }
    })

    client.activate()
    clientRef.current = client
  }, [])

  const disconnect = useCallback(() => {
    subscriptionRef.current?.unsubscribe()
    subscriptionRef.current = null
    errorSubRef.current?.unsubscribe()
    errorSubRef.current = null
    clientRef.current?.deactivate()
    clientRef.current = null
  }, [])

  // 토큰 갱신 시 재연결
  useTokenRefresh({
    onRefreshed: () => {
      disconnect()
      connect()
    }
  })

  // 초기 연결
  useEffect(() => {
    if (!accessToken) return
    connect()
    return () => disconnect()
  }, [accessToken])

  // 채널 변경 시 재구독
  useEffect(() => {
    const client = clientRef.current
    if (!client?.connected || !currentChannelId) return
    subscribeChannel(client, currentChannelId)
  }, [currentChannelId])

  // 메시지 전송
  const sendMessage = useCallback((channelId, content, fileId = null) => {
    const client = clientRef.current
    if (!client?.connected) return

    const payload = { content }
    if (fileId) payload.fileId = fileId

    client.publish({
      destination: `/app/channel/${channelId}/send`,
      body: JSON.stringify(payload)
    })
  }, [])

  // 스레드 전송
  const sendThreadMessage = useCallback((channelId, parentId, content) => {
    const client = clientRef.current
    if (!client?.connected) return

    client.publish({
      destination: `/app/channel/${channelId}/thread/${parentId}/send`,
      body: JSON.stringify({ content })
    })
  }, [])

  // 메시지 편집
  const editMessage = useCallback((channelId, messageId, content) => {
    const client = clientRef.current
    if (!client?.connected) return

    client.publish({
      destination: `/app/channel/${channelId}/message/${messageId}/edit`,
      body: JSON.stringify({ content })
    })
  }, [])

  // 메시지 삭제
  const deleteMessage = useCallback((channelId, messageId) => {
    const client = clientRef.current
    if (!client?.connected) return

    client.publish({
      destination: `/app/channel/${channelId}/message/${messageId}/delete`,
      body: ''
    })
  }, [])

  // 전역 store에 등록
  useEffect(() => {
    registerStomp(sendMessage, sendThreadMessage, editMessage, deleteMessage)
  }, [sendMessage, sendThreadMessage, editMessage, deleteMessage])

  return { sendMessage, sendThreadMessage, editMessage, deleteMessage }
}
