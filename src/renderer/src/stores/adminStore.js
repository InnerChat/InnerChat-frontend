import { create } from 'zustand'
import axios from 'axios'
import { useAuthStore } from './authStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

function authHeader() {
  const token = useAuthStore.getState().accessToken
  return { Authorization: `Bearer ${token}` }
}

export const useAdminStore = create((set) => ({
  users: [],
  loading: false,
  error: null,

  async fetchUsers() {
    set({ loading: true, error: null })
    try {
      const { data } = await axios.get(`${BASE_URL}/api/v1/admin/users`, {
        headers: authHeader()
      })
      set({ users: data })
    } catch (e) {
      set({ error: e.response?.data?.message ?? '유저 목록을 불러오지 못했습니다.' })
    } finally {
      set({ loading: false })
    }
  },

  async createUser(form) {
    set({ error: null })
    const { data } = await axios.post(`${BASE_URL}/api/v1/admin/users`, form, {
      headers: authHeader()
    })
    set((state) => ({ users: [...state.users, data] }))
    return data
  },

  async deactivateUser(userId) {
    await axios.delete(`${BASE_URL}/api/v1/admin/users/${userId}`, {
      headers: authHeader()
    })
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, isActive: false } : u
      )
    }))
  }
}))
