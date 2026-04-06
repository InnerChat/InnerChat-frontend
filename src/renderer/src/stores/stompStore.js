import { create } from 'zustand'

export const useStompStore = create((set) => ({
  sendMessage: null,
  sendThreadMessage: null,
  editMessage: null,
  deleteMessage: null,

  register(sendMessage, sendThreadMessage, editMessage, deleteMessage) {
    set({ sendMessage, sendThreadMessage, editMessage, deleteMessage })
  }
}))
