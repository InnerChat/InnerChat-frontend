import ChatWorkspace from '@/features/chat/components/ChatWorkspace'
import useChatLayoutState from '@/features/chat/hooks/useChatLayoutState'
import styles from './MainLayout.module.css'

export default function MainLayout() {
  const state = useChatLayoutState()

  return (
    <div className={styles.root}>
      <ChatWorkspace state={state} />
    </div>
  )
}
