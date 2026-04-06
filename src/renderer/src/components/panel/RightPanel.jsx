import { useState } from 'react'
import PinnedMessages from './PinnedMessages'
import MemberList from './MemberList'
import SearchPanel from './SearchPanel'
import UserProfileModal from './UserProfileModal'
import ScrollArea from '@ui/ScrollArea'
import styles from './RightPanel.module.css'

/**
 * @param {'pin'|'member'|'search'} mode
 */
export default function RightPanel({ mode, onClose }) {
  const [selectedUserId, setSelectedUserId] = useState(null)

  const title = mode === 'pin' ? '📌 핀된 메시지' : mode === 'search' ? '🔍 메시지 검색' : '👥 멤버'

  return (
    <>
      <div className={styles.panel}>
        <div className={styles.header}>
          <span>{title}</span>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>
        <ScrollArea>
          <div className={styles.content}>
            {mode === 'pin' && <PinnedMessages />}
            {mode === 'search' && <SearchPanel />}
            {mode === 'member' && (
              <MemberList onUserClick={(id) => setSelectedUserId(id)} />
            )}
          </div>
        </ScrollArea>
      </div>

      <UserProfileModal
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </>
  )
}
