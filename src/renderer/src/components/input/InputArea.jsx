import { useState, useRef, useMemo } from 'react'
import FormatToolbar from './FormatToolbar'
import MessageInput from './MessageInput'
import styles from './InputArea.module.css'
import { useChannelStore } from '@stores/channelStore'

function detectTrigger(text, cursorPos) {
  const before = text.slice(0, cursorPos)
  const match = before.match(/[@#](\w*)$/)
  if (!match) return null
  return {
    type: match[0][0] === '@' ? 'mention' : 'channel',
    query: match[1],
    triggerStart: cursorPos - match[0].length
  }
}

export default function InputArea() {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)
  const [popup, setPopup] = useState(null) // { type, query, triggerStart }

  const members = useChannelStore((s) => s.members)
  const channels = useChannelStore((s) => s.channels)

  const filteredItems = useMemo(() => {
    if (!popup) return []
    const q = popup.query.toLowerCase()
    if (popup.type === 'mention') {
      return members
        .filter(
          (m) =>
            m.username.toLowerCase().includes(q) ||
            m.displayName.toLowerCase().includes(q)
        )
        .slice(0, 8)
    }
    return channels
      .filter((ch) => !ch.isDirect && ch.name.toLowerCase().includes(q))
      .slice(0, 8)
  }, [popup, members, channels])

  function applyFormat(style) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = text.slice(start, end)
    let before, after
    switch (style) {
      case 'bold':   before = '**'; after = '**'; break
      case 'italic': before = '_';  after = '_';  break
      case 'code':
        if (selected.includes('\n')) { before = '```\n'; after = '\n```' }
        else                         { before = '`';     after = '`'     }
        break
      case 'link':   before = '[';  after = '](url)'; break
      default: return
    }
    const newText = text.slice(0, start) + before + selected + after + text.slice(end)
    setText(newText)
    const newStart = start + before.length
    const newEnd = newStart + selected.length
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(newStart, newEnd)
    })
  }

  function handleInput(newText, cursorPos) {
    const trigger = detectTrigger(newText, cursorPos)
    setPopup(trigger)
  }

  // MessageInput에서 onKeyDown보다 먼저 실행 — true 반환 시 기본 동작 취소
  function handlePopupKeyDown(e) {
    if (!popup) return false
    if (e.key === 'Escape') {
      setPopup(null)
      return true
    }
    // 팝업 열린 상태에서 Enter는 전송 차단 (클릭으로만 선택)
    if (e.key === 'Enter' && filteredItems.length > 0) {
      return true
    }
    return false
  }

  function handleSelect(item) {
    const el = textareaRef.current
    if (!el || !popup) return
    const cursorPos = el.selectionStart
    const insertText =
      popup.type === 'mention' ? `@${item.username}` : `#${item.name}`
    const newText =
      text.slice(0, popup.triggerStart) + insertText + ' ' + text.slice(cursorPos)
    setText(newText)
    setPopup(null)
    const newCursor = popup.triggerStart + insertText.length + 1
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(newCursor, newCursor)
    })
  }

  return (
    <div className={styles.area}>
      {popup && filteredItems.length > 0 && (
        <div className={styles.popup}>
          <div className={styles.popupLabel}>
            {popup.type === 'mention' ? '멤버' : '채널'}
          </div>
          {filteredItems.map((item) => (
            <button
              key={popup.type === 'mention' ? item.userId : item.id}
              className={styles.popupItem}
              onMouseDown={(e) => {
                e.preventDefault() // textarea 포커스 유지
                handleSelect(item)
              }}
            >
              <span className={styles.popupTrigger}>
                {popup.type === 'mention'
                  ? `@${item.username}`
                  : `#${item.name}`}
              </span>
              {popup.type === 'mention' && item.displayName && (
                <span className={styles.popupSub}>{item.displayName}</span>
              )}
              {popup.type === 'channel' && item.description && (
                <span className={styles.popupSub}>{item.description}</span>
              )}
            </button>
          ))}
        </div>
      )}
      <FormatToolbar onFormat={applyFormat} />
      <MessageInput
        text={text}
        setText={setText}
        textareaRef={textareaRef}
        onInput={handleInput}
        onKeyDown={handlePopupKeyDown}
      />
    </div>
  )
}
