import clsx from 'clsx'
import { useAuthStore } from '@stores/authStore'
import { useMessageStore } from '@stores/messageStore'
import axios from 'axios'
import styles from './ReactionBar.module.css'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export default function ReactionBar({ channelId, messageId, reactions = {}, myReactions = [] }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const updateReaction = useMessageStore((s) => s.updateReaction)

  async function handleReaction(emoji) {
    const isMine = myReactions.includes(emoji)
    // 낙관적 업데이트
    updateReaction(channelId, messageId, emoji, isMine ? -1 : 1)

    try {
      if (isMine) {
        await axios.delete(
          `${BASE_URL}/api/v1/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
      } else {
        await axios.post(
          `${BASE_URL}/api/v1/messages/${messageId}/reactions`,
          { emoji },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
      }
    } catch {
      // 실패 시 롤백
      updateReaction(channelId, messageId, emoji, isMine ? 1 : -1)
    }
  }

  const entries = Object.entries(reactions).filter(([, count]) => count > 0)
  if (entries.length === 0) return null

  return (
    <div className={styles.bar}>
      {entries.map(([emoji, count]) => (
        <button
          key={emoji}
          className={clsx(styles.reaction, myReactions.includes(emoji) && styles.mine)}
          onClick={() => handleReaction(emoji)}
        >
          {emoji} {count}
        </button>
      ))}
    </div>
  )
}
