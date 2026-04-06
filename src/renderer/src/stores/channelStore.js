import { create } from 'zustand'
import axios from 'axios'
import { useAuthStore } from './authStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL
const WORKSPACE_ID = import.meta.env.VITE_WORKSPACE_ID

export const useChannelStore = create((set, get) => ({
  workspace: null,       // { workspaceId, name, memberCount }
  channels: [],          // ChannelResponse[]
  currentChannelId: null,
  members: [],           // WorkspaceMemberResponse[]

  setCurrentChannel(channelId) {
    set({ currentChannelId: channelId })
  },

  async fetchWorkspace() {
    const token = useAuthStore.getState().accessToken
    try {
      const { data } = await axios.get(`${BASE_URL}/api/v1/workspaces/${WORKSPACE_ID}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      set({ workspace: data })
    } catch (e) {
      console.error('fetchWorkspace failed', e)
    }
  },

  async fetchChannels() {
    const token = useAuthStore.getState().accessToken
    try {
      const { data } = await axios.get(
        `${BASE_URL}/api/v1/workspaces/${WORKSPACE_ID}/channels`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      set({ channels: data })
    } catch (e) {
      console.error('fetchChannels failed', e)
    }
  },

  async fetchMembers() {
    const token = useAuthStore.getState().accessToken
    try {
      const { data } = await axios.get(
        `${BASE_URL}/api/v1/workspaces/${WORKSPACE_ID}/members`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      set({ members: data })
    } catch (e) {
      console.error('fetchMembers failed', e)
    }
  },

  async getOrCreateDm(targetUserId) {
    const token = useAuthStore.getState().accessToken
    const { data } = await axios.post(
      `${BASE_URL}/api/v1/workspaces/${WORKSPACE_ID}/dm`,
      { targetUserId },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    // 채널 목록에 없으면 추가
    set((state) => {
      const exists = state.channels.some((ch) => ch.id === data.id)
      return exists ? {} : { channels: [...state.channels, data] }
    })
    return data
  },

  async inviteMember(userId) {
    const token = useAuthStore.getState().accessToken
    await axios.post(
      `${BASE_URL}/api/v1/workspaces/${WORKSPACE_ID}/members`,
      { userId },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    await get().fetchMembers()
  },

  async removeMember(userId) {
    const token = useAuthStore.getState().accessToken
    await axios.delete(
      `${BASE_URL}/api/v1/workspaces/${WORKSPACE_ID}/members/${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    set((state) => ({ members: state.members.filter((m) => m.userId !== userId) }))
  },

  async createChannel({ name, description, isPrivate }) {
    const token = useAuthStore.getState().accessToken
    const { data } = await axios.post(
      `${BASE_URL}/api/v1/workspaces/${WORKSPACE_ID}/channels`,
      { name, description, isPrivate },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    set((state) => ({ channels: [...state.channels, data] }))
    return data
  },

  // 미읽음 카운트 증가 (STOMP 이벤트 수신 시 호출)
  incrementUnread(channelId) {
    set((state) => ({
      channels: state.channels.map((ch) =>
        ch.id === channelId
          ? { ...ch, unreadCount: (ch.unreadCount ?? 0) + 1 }
          : ch
      )
    }))
  },

  // 채널 입장 시 미읽음 초기화
  clearUnread(channelId) {
    set((state) => ({
      channels: state.channels.map((ch) =>
        ch.id === channelId ? { ...ch, unreadCount: 0 } : ch
      )
    }))
  }
}))
