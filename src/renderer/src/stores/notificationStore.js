import { create } from 'zustand'

// SSE /api/v1/notifications/stream 연동 완료 (useSSE 훅에서 연결).
// 미읽음 카운트는 STOMP NotificationEvent 수신 시 channelStore.incrementUnread() 로 처리.
// 이 Store는 앱 전역 알림 토스트(배너) 표시 용도로 사용한다.

export const useNotificationStore = create((set, get) => ({
  // { id, type, message, channelId } 형태의 알림 목록
  notifications: [],

  push(notification) {
    const id = Date.now()
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }]
    }))
    // 5초 후 자동 제거
    setTimeout(() => get().dismiss(id), 5000)
  },

  dismiss(id) {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    }))
  },

  clear() {
    set({ notifications: [] })
  }
}))
