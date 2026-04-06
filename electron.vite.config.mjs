import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    define: {
      // sockjs-client가 Node.js global을 참조하므로 브라우저 환경에서 폴리필
      global: 'globalThis'
    },
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        '@ui': resolve('src/renderer/src/components/ui'),
        '@stores': resolve('src/renderer/src/stores'),
        '@hooks': resolve('src/renderer/src/hooks')
      }
    },
    plugins: [react()]
  }
})
