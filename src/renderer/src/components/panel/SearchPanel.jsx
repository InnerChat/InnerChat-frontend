import { useState, useEffect } from 'react'
import { useChannelStore } from '@stores/channelStore'
import { useMessageSearch } from '@hooks/useMessageSearch'
import Spinner from '@ui/Spinner'
import styles from './SearchPanel.module.css'

function formatTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function SearchPanel() {
  const currentChannelId = useChannelStore((s) => s.currentChannelId)
  const { results, totalCount, loading, search, clear } = useMessageSearch()
  const [query, setQuery] = useState('')

  // 디바운스 검색
  useEffect(() => {
    if (!query.trim()) {
      clear()
      return
    }
    const timer = setTimeout(() => search(currentChannelId, query), 400)
    return () => clearTimeout(timer)
  }, [query, currentChannelId])

  // 채널 변경 시 검색 초기화
  useEffect(() => {
    setQuery('')
    clear()
  }, [currentChannelId])

  return (
    <div className={styles.container}>
      <input
        className={styles.input}
        placeholder="메시지 검색..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />

      {loading && (
        <div className={styles.status}>
          <Spinner size="sm" />
        </div>
      )}

      {!loading && query.trim() && (
        <div className={styles.count}>
          {totalCount > 0 ? `${totalCount}건 검색됨` : '결과 없음'}
        </div>
      )}

      <div className={styles.results}>
        {results.map((msg) => (
          <div key={msg.id ?? msg.messageId} className={styles.item}>
            <div className={styles.meta}>
              <span className={styles.name}>{msg.displayName ?? '알 수 없음'}</span>
              <span className={styles.time}>{formatTime(msg.createdAt)}</span>
            </div>
            <div className={styles.content}>{msg.content}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
