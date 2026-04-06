import { useState, useEffect } from 'react'
import ChannelSidebar from '@/components/sidebar/ChannelSidebar'
import ChatArea from '@/components/chat/ChatArea'
import RightPanel from '@/components/panel/RightPanel'
import ThreadDrawer from '@/components/thread/ThreadDrawer'
import ToastList from '@ui/ToastList'
import { useStompClient } from '@hooks/useStompClient'
import { useSSE } from '@hooks/useSSE'
import styles from './MainLayout.module.css'

export default function MainLayout() {
  useStompClient()
  useSSE()

  // Electron 네이티브 알림 권한 요청
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const [rightPanel, setRightPanel] = useState(null)   // 'pin' | 'member' | null
  const [threadMessageId, setThreadMessageId] = useState(null)

  function togglePanel(mode) {
    setRightPanel((prev) => (prev === mode ? null : mode))
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <ChannelSidebar />
      </aside>

      <main className={styles.chat}>
        <ChatArea
          onPinClick={() => togglePanel('pin')}
          onMemberClick={() => togglePanel('member')}
          onSearchClick={() => togglePanel('search')}
          onThreadOpen={(id) => setThreadMessageId(id)}
        />
      </main>

      {rightPanel && (
        <aside className={styles.panel}>
          <RightPanel mode={rightPanel} onClose={() => setRightPanel(null)} />
        </aside>
      )}

      {threadMessageId && (
        <aside className={styles.panel}>
          <ThreadDrawer
            parentMessageId={threadMessageId}
            onClose={() => setThreadMessageId(null)}
          />
        </aside>
      )}

      <ToastList />
    </div>
  )
}
