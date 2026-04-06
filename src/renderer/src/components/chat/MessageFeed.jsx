import { useEffect, useRef, useCallback } from 'react'
import { useMessageStore } from '@stores/messageStore'
import { useChannelStore } from '@stores/channelStore'
import MessageBubble from './MessageBubble'
import Divider from '@ui/Divider'
import Spinner from '@ui/Spinner'
import styles from './MessageFeed.module.css'

const EMPTY_MESSAGES = []

function toDateKey(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function formatDividerLabel(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const todayKey = toDateKey(now.toISOString())
  const key = toDateKey(dateStr)

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const yesterdayKey = toDateKey(yesterday.toISOString())

  if (key === todayKey) return '오늘'
  if (key === yesterdayKey) return '어제'
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

export default function MessageFeed({ onThreadOpen }) {
  const currentChannelId = useChannelStore((s) => s.currentChannelId)
  const messages = useMessageStore((s) => s.messagesByChannel[currentChannelId] ?? EMPTY_MESSAGES)
  const fetchMessages = useMessageStore((s) => s.fetchMessages)
  const fetchMoreMessages = useMessageStore((s) => s.fetchMoreMessages)
  const hasNext = useMessageStore((s) => s.hasNextByChannel[currentChannelId] ?? false)
  const bottomRef = useRef(null)

  // 채널 변경 시 메시지 로드
  useEffect(() => {
    if (!currentChannelId) return
    fetchMessages(currentChannelId)
  }, [currentChannelId])

  // 새 메시지 도착 시 하단 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // 상단 도달 시 이전 메시지 로드
  const handleScroll = useCallback((e) => {
    if (e.target.scrollTop === 0 && hasNext) {
      fetchMoreMessages(currentChannelId)
    }
  }, [currentChannelId, hasNext])

  if (!currentChannelId) {
    return (
      <div className={styles.empty}>
        <p>채널을 선택해주세요</p>
      </div>
    )
  }

  let lastDateKey = null

  return (
    <div className={styles.feed} onScroll={handleScroll}>
      {hasNext && (
        <div className={styles.loadingTop}>
          <Spinner size="sm" />
        </div>
      )}
      {messages.map((msg) => {
        const dateKey = toDateKey(msg.createdAt)
        const showDivider = dateKey && dateKey !== lastDateKey
        if (showDivider) lastDateKey = dateKey

        return (
          <div key={msg.messageId}>
            {showDivider && <Divider label={formatDividerLabel(msg.createdAt)} />}
            <MessageBubble
              message={msg}
              channelId={currentChannelId}
              onThreadOpen={onThreadOpen}
            />
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
