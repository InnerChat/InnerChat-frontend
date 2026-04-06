import { create } from 'zustand'
import axios from 'axios'
import { useAuthStore } from './authStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export const useMessageStore = create((set, get) => ({
  // { [channelId]: MessageResponse[] }
  messagesByChannel: {},

  // { [channelId]: boolean } — 더 불러올 메시지 존재 여부
  hasNextByChannel: {},

  getMessages(channelId) {
    return get().messagesByChannel[channelId] ?? []
  },

  // 초기 메시지 로드 (채널 입장 시)
  async fetchMessages(channelId) {
    const token = useAuthStore.getState().accessToken
    try {
      const { data } = await axios.get(
        `${BASE_URL}/api/v1/channels/${channelId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const normalize = (msg) => ({ ...msg, messageId: msg.id ?? msg.messageId })
      set((state) => ({
        messagesByChannel: { ...state.messagesByChannel, [channelId]: (data.content ?? []).map(normalize) },
        hasNextByChannel: { ...state.hasNextByChannel, [channelId]: data.hasNext ?? false }
      }))
    } catch (e) {
      console.error('fetchMessages failed', e)
    }
  },

  // 위로 스크롤 시 이전 메시지 로드 (커서 기반)
  async fetchMoreMessages(channelId) {
    const messages = get().getMessages(channelId)
    if (!messages.length) return
    const cursor = messages[0].messageId
    const token = useAuthStore.getState().accessToken
    try {
      const { data } = await axios.get(
        `${BASE_URL}/api/v1/channels/${channelId}/messages?cursor=${cursor}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const normalize = (msg) => ({ ...msg, messageId: msg.id ?? msg.messageId })
      set((state) => ({
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: [...(data.content ?? []).map(normalize), ...messages]
        },
        hasNextByChannel: { ...state.hasNextByChannel, [channelId]: data.hasNext ?? false }
      }))
    } catch (e) {
      console.error('fetchMoreMessages failed', e)
    }
  },

  // STOMP NotificationEvent 수신 시 타입별 분기 처리
  handleStompEvent(event) {
    const { type } = event
    if (type === 'MESSAGE_EDIT') {
      get().updateFromStomp(event)
    } else if (type === 'MESSAGE_DELETE') {
      get().deleteFromStomp(event)
    } else {
      get().appendFromStomp(event)
    }
  },

  // 새 메시지 추가 (MESSAGE, THREAD_REPLY)
  appendFromStomp(event) {
    const { channelId } = event
    set((state) => ({
      messagesByChannel: {
        ...state.messagesByChannel,
        [channelId]: [...(state.messagesByChannel[channelId] ?? []), event]
      }
    }))
  },

  // 메시지 편집 반영 (MESSAGE_EDIT)
  updateFromStomp(event) {
    const { channelId, messageId } = event
    set((state) => ({
      messagesByChannel: {
        ...state.messagesByChannel,
        [channelId]: (state.messagesByChannel[channelId] ?? []).map((msg) =>
          (msg.messageId ?? msg.id) === messageId
            ? { ...msg, content: event.content, isEdited: true }
            : msg
        )
      }
    }))
  },

  // 메시지 삭제 반영 (MESSAGE_DELETE)
  deleteFromStomp(event) {
    const { channelId, messageId } = event
    set((state) => ({
      messagesByChannel: {
        ...state.messagesByChannel,
        [channelId]: (state.messagesByChannel[channelId] ?? []).filter(
          (msg) => (msg.messageId ?? msg.id) !== messageId
        )
      }
    }))
  },

  // 낙관적 반응 업데이트
  updateReaction(channelId, messageId, emoji, delta) {
    set((state) => ({
      messagesByChannel: {
        ...state.messagesByChannel,
        [channelId]: (state.messagesByChannel[channelId] ?? []).map((msg) => {
          if (msg.messageId !== messageId) return msg
          const reactions = { ...(msg.reactions ?? {}) }
          reactions[emoji] = Math.max(0, (reactions[emoji] ?? 0) + delta)
          return { ...msg, reactions }
        })
      }
    }))
  }
}))
