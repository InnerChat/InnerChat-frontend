import { create } from 'zustand'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export const useAuthStore = create((set, get) => ({
  isLoggedIn: false,
  role: null,
  user: null,          // { userId, userName }
  isGuest: false,

  setLoginSession({ user = null, role = null } = {}) {
    set({
      isLoggedIn: true,
      user,
      role,
      isGuest: false
    })
  },

  setUser(user) {
    set({ user })
  },

  loginAsGuest() {
    set({ isGuest: true })
  },

  async logout() {
    await axios.post(`${BASE_URL}/api/v1/auth/logout`, {}, { withCredentials: true }).catch(() => {})
    set({ isLoggedIn: false, role: null, user: null, isGuest: false })
  },

  isAuthenticated() {
    return get().isLoggedIn || get().isGuest
  },

  isAdmin() {
    return get().role === 'ADMIN'
  }
}))
