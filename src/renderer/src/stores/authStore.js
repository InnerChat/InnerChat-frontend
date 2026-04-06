import { create } from 'zustand'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

function parseRole(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role ?? 'USER'
  } catch {
    return 'USER'
  }
}

export const useAuthStore = create((set, get) => ({
  accessToken: null,
  refreshToken: null,
  role: 'USER',
  user: null,          // { userId, username, displayName, avatarUrl }
  _refreshTimer: null,

  setTokens(accessToken, refreshToken) {
    get()._clearRefreshTimer()
    set({ accessToken, refreshToken, role: parseRole(accessToken) })
    get()._scheduleRefresh()
  },

  setUser(user) {
    set({ user })
  },

  async logout() {
    const { refreshToken } = get()
    if (refreshToken) {
      await axios.post(`${BASE_URL}/api/v1/auth/logout`, { refreshToken }).catch(() => {})
    }
    get()._clearRefreshTimer()
    set({ accessToken: null, refreshToken: null, role: 'USER', user: null })
  },

  // 액세스 토큰 만료 14분 후 자동 갱신 (만료 1분 전)
  _scheduleRefresh() {
    const timer = setTimeout(() => get()._refresh(), 14 * 60 * 1000)
    set({ _refreshTimer: timer })
  },

  _clearRefreshTimer() {
    const { _refreshTimer } = get()
    if (_refreshTimer) clearTimeout(_refreshTimer)
    set({ _refreshTimer: null })
  },

  async _refresh() {
    const { refreshToken } = get()
    if (!refreshToken) return

    try {
      const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, { refreshToken })
      get().setTokens(data.accessToken, data.refreshToken)
    } catch {
      get().logout()
    }
  },

  isAuthenticated() {
    return !!get().accessToken
  },

  isAdmin() {
    return get().role === 'ADMIN'
  }
}))
