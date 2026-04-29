/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import Avatar from '@ui/Avatar'
import styles from './MessageGroup.module.css'

function renderInlineCode(text) {
  const segments = text.split(/(`[^`]+`)/g)

  return segments.map((segment, index) => {
    if (segment.startsWith('`') && segment.endsWith('`')) {
      return <code key={`code-${index}`}>{segment.slice(1, -1)}</code>
    }

    return <span key={`text-${index}`}>{segment}</span>
  })
}

export default function MessageGroup({
  message,
  currentUserId,
  onAddReaction,
  onOpenThread,
  onEditMessage,
  onDeleteMessage
}) {
  const [contextMenu, setContextMenu] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)
  const isOwnMessage = Number(currentUserId) === Number(message.authorId)
  const isModified = String(message.status ?? '').toLowerCase() === 'modified'

  useEffect(() => {
    if (!contextMenu) {
      return undefined
    }

    function handleWindowClick() {
      setContextMenu(null)
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setContextMenu(null)
      }
    }

    window.addEventListener('click', handleWindowClick)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('click', handleWindowClick)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [contextMenu])

  function handleOpenContextMenu(event) {
    event.preventDefault()
    if (!isOwnMessage) {
      return
    }
    setContextMenu({ x: event.clientX, y: event.clientY })
  }

  function handleEditMessage() {
    setContextMenu(null)
    if (!onEditMessage) {
      return
    }
    setEditContent(String(message.text ?? ''))
    setIsEditing(true)
  }

  function handleDeleteMessage() {
    setContextMenu(null)
    setIsDeleteConfirmOpen(true)
  }

  function handleCancelEdit() {
    if (isSubmittingEdit) {
      return
    }
    setIsEditing(false)
    setEditContent('')
  }

  async function handleSubmitEdit(event) {
    event.preventDefault()
    if (!onEditMessage) {
      return
    }

    const trimmed = editContent.trim()
    if (!trimmed || trimmed === String(message.text ?? '').trim()) {
      setIsEditing(false)
      return
    }

    try {
      setIsSubmittingEdit(true)
      await onEditMessage(message, trimmed)
      setIsEditing(false)
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  function handleCancelDelete() {
    if (isSubmittingDelete) {
      return
    }
    setIsDeleteConfirmOpen(false)
  }

  async function handleConfirmDelete() {
    if (!onDeleteMessage) {
      return
    }

    try {
      setIsSubmittingDelete(true)
      await onDeleteMessage(message)
      setIsDeleteConfirmOpen(false)
    } finally {
      setIsSubmittingDelete(false)
    }
  }

  return (
    <article
      className={clsx(styles.group, isOwnMessage && styles.mine)}
      onContextMenu={handleOpenContextMenu}
    >
      <Avatar size="lg" colorKey={message.author.colorKey} label={message.author.initials} />
      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.name}>{message.author.name}</span>
          <span className={styles.time}>{message.time}</span>
        </div>
        <p className={styles.text}>
          {renderInlineCode(message.text)}
          {isModified ? <span className={styles.modifiedLabel}>수정됨</span> : null}
        </p>

        {isEditing ? (
          <form className={styles.inlineEditBox} onSubmit={handleSubmitEdit}>
            <textarea
              className={styles.inlineEditInput}
              value={editContent}
              onChange={(event) => setEditContent(event.target.value)}
            />
            <div className={styles.inlineEditActions}>
              <button
                type="button"
                className={styles.inlineEditCancel}
                onClick={handleCancelEdit}
                disabled={isSubmittingEdit}
              >
                취소
              </button>
              <button type="submit" className={styles.inlineEditSave} disabled={isSubmittingEdit}>
                {isSubmittingEdit ? '저장중' : '저장'}
              </button>
            </div>
          </form>
        ) : null}

        {message.code ? (
          <div className={styles.codeBlock}>
            <div className={styles.codeHeader}>
              <span>{message.code.language}</span>
              <button
                type="button"
                className={styles.codeCopyButton}
                onClick={() => onAddReaction(message.id, 'copy')}
              >
                복사
              </button>
            </div>
            <pre className={styles.codeContent}>{message.code.content}</pre>
          </div>
        ) : null}

        {message.reactions?.length ? (
          <div className={styles.reactionBar}>
            {message.reactions.map((reaction) => (
              <button
                type="button"
                key={reaction.key}
                className={reaction.isMine ? styles.myReaction : styles.reaction}
                onClick={() => onAddReaction(message.id, reaction.emoji)}
              >
                {reaction.emoji} {reaction.count}
              </button>
            ))}
            <button
              type="button"
              className={styles.reaction}
              onClick={() => onAddReaction(message.id, 'plus')}
            >
              + 반응
            </button>
          </div>
        ) : null}

        {message.threadPreview ? (
          <button
            type="button"
            className={styles.threadPreview}
            onClick={() => onOpenThread(message.id)}
          >
            {message.threadPreview.participantInitials.map((initials) => (
              <Avatar
                key={`${message.id}-${initials}`}
                size="sm"
                label={initials}
                colorKey="indigo"
              />
            ))}
            <span>{message.threadPreview.text}</span>
          </button>
        ) : null}
      </div>

      {contextMenu ? (
        <div
          className={styles.contextMenu}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(event) => event.stopPropagation()}
        >
          <button type="button" className={styles.contextMenuItem} onClick={handleEditMessage}>
            수정
          </button>
          <button
            type="button"
            className={`${styles.contextMenuItem} ${styles.contextMenuDanger}`}
            onClick={handleDeleteMessage}
          >
            삭제
          </button>
        </div>
      ) : null}

      {isDeleteConfirmOpen ? (
        <div className={styles.modalOverlay} onClick={handleCancelDelete}>
          <div
            className={styles.confirmCard}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="메시지 삭제 확인"
          >
            <p className={styles.confirmText}>진짜 삭제하겠냐고</p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.confirmCancel}
                onClick={handleCancelDelete}
                disabled={isSubmittingDelete}
              >
                취소
              </button>
              <button
                type="button"
                className={styles.confirmDelete}
                onClick={handleConfirmDelete}
                disabled={isSubmittingDelete}
              >
                {isSubmittingDelete ? '삭제중' : '확인'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  )
}
