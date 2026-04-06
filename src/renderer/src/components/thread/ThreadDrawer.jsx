import { useEffect, useState } from 'react'
import { useAuthStore } from '@stores/authStore'
import { useChannelStore } from '@stores/channelStore'
import { useStompClient } from '@hooks/useStompClient'
import Avatar from '@ui/Avatar'
import Input from '@ui/Input'
import Button from '@ui/Button'
import Spinner from '@ui/Spinner'
import axios from 'axios'
import styles from './ThreadDrawer.module.css'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export default function ThreadDrawer({ parentMessageId, onClose }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const currentChannelId = useChannelStore((s) => s.currentChannelId)
  const { sendThreadMessage } = useStompClient()

  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')

  useEffect(() => {
    if (!parentMessageId) return
    setLoading(true)
    axios
      .get(`${BASE_URL}/api/v1/messages/${parentMessageId}/threads`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      .then(({ data }) => setThreads(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [parentMessageId])

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || !currentChannelId || !parentMessageId) return
    sendThreadMessage(currentChannelId, parentMessageId, trimmed)
    setText('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={styles.drawer}>
      <div className={styles.header}>
        <span>스레드</span>
        <button className={styles.close} onClick={onClose}>✕</button>
      </div>

      <div className={styles.messages}>
        {loading ? (
          <div className={styles.loading}><Spinner /></div>
        ) : (
          threads.map((msg) => (
            <div key={msg.messageId} className={styles.msg}>
              <Avatar size="sm" colorKey={msg.colorKey ?? 'indigo'} label={msg.initials ?? '?'} />
              <div className={styles.msgBody}>
                <div className={styles.msgMeta}>
                  <span className={styles.msgName}>{msg.displayName}</span>
                  <span className={styles.msgTime}>
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </span>
                </div>
                <p className={styles.msgText}>{msg.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={styles.inputWrap}>
        <Input variant="box">
          <textarea
            className={styles.field}
            placeholder="스레드에 답글 보내기..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <Button variant="primary" className={styles.send} onClick={handleSend} disabled={!text.trim()}>
            ↑
          </Button>
        </Input>
      </div>
    </div>
  )
}
