import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('electronAPI', {
      // 데스크탑 알림 (Phase 3에서 구현)
      showNotification: (title, body) =>
        ipcRenderer.invoke('show-notification', { title, body })
    })
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
}
