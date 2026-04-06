import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import Avatar from '@ui/Avatar'
import MessageContent from './MessageContent'
import ReactionBar from './ReactionBar'
import ThreadPreview from './ThreadPreview'
import styles from './MessageBubble.module.css'
import { useAuthStore } from '@stores/authStore'
import { useStompStore } from '@stores/stompStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export default function MessageBubble({ message, channelId, onThreadOpen }) {
  const {
    messageId,
    userId,
    displayName,
    initials,
    colorKey,
    createdAt,
    content,
    isEdited,
    attachment,
    reactions,
    myReactions,
    threadCount,
    threadLastAt,
    threadParticipants
  } = message

  const currentUserId = useAuthStore((s) => s.user?.id)
  const accessToken = useAuthStore((s) => s.accessToken)
  const editMessage = useStompStore((s) => s.editMessage)
  const deleteMessage = useStompStore((s) => s.deleteMessage)

  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pinning, setPinning] = useState(false)
  const textareaRef = useRef(null)

  const isOwner = userId != null && userId === currentUserId

  async function handlePin() {
    if (pinning) return
    setPinning(true)
    try {
      await axios.post(
        `${BASE_URL}/api/v1/messages/${messageId}/pin?channelId=${channelId}`,
        null,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
    } catch {
      // 이미 핀된 경우 등 무시
    } finally {
      setPinning(false)
      setHovered(false)
    }
  }

  const time = createdAt
    ? new Date(createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : ''

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(editContent.length, editContent.length)
    }
  }, [editing])

  function handleEditStart() {
    setEditContent(content)
    setEditing(true)
    setHovered(false)
  }

  function handleEditSave() {
    const trimmed = editContent.trim()
    if (trimmed && trimmed !== content) {
      editMessage?.(channelId, messageId, trimmed)
    }
    setEditing(false)
  }

  function handleEditCancel() {
    setEditing(false)
  }

  function handleEditKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEditSave()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
  }

  function handleDeleteConfirm() {
    deleteMessage?.(channelId, messageId)
    setConfirmDelete(false)
  }

  return (
    <div
      className={`${styles.group} ${hovered ? styles.groupHovered : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false) }}
    >
      <Avatar size="lg" colorKey={colorKey ?? 'indigo'} label={initials ?? '?'} />
      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.name}>{displayName ?? '알 수 없음'}</span>
          <span className={styles.time}>{time}</span>
          {isEdited && <span className={styles.edited}>(수정됨)</span>}
        </div>

        {editing ? (
          <div className={styles.editArea}>
            <textarea
              ref={textareaRef}
              className={styles.editTextarea}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleEditKeyDown}
              rows={Math.min(8, (editContent.match(/\n/g)?.length ?? 0) + 1)}
            />
            <div className={styles.editActions}>
              <span className={styles.editHint}>Enter로 저장 · Esc로 취소</span>
              <button className={styles.editBtn} onClick={handleEditSave}>저장</button>
              <button className={`${styles.editBtn} ${styles.editBtnCancel}`} onClick={handleEditCancel}>취소</button>
            </div>
          </div>
        ) : (
          <MessageContent content={content} attachment={attachment} />
        )}

        <ReactionBar
          channelId={channelId}
          messageId={messageId}
          reactions={reactions}
          myReactions={myReactions}
        />
        <ThreadPreview
          threadCount={threadCount}
          lastAt={threadLastAt}
          participants={threadParticipants}
          onOpen={() => onThreadOpen?.(messageId)}
        />

        {confirmDelete && (
          <div className={styles.deleteConfirm}>
            <span>메시지를 삭제할까요?</span>
            <button className={styles.deleteDangerBtn} onClick={handleDeleteConfirm}>삭제</button>
            <button className={styles.deleteCancelBtn} onClick={() => setConfirmDelete(false)}>취소</button>
          </div>
        )}
      </div>

      {hovered && !editing && (
        <div className={styles.actionMenu}>
          <button
            className={styles.actionBtn}
            title="핀 추가"
            onClick={handlePin}
            disabled={pinning}
          >
            📌
          </button>
          {isOwner && (
            <>
              <button className={styles.actionBtn} title="편집" onClick={handleEditStart}>✏️</button>
              <button
                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                title="삭제"
                onClick={() => setConfirmDelete(true)}
              >
                🗑️
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
