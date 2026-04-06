import { useRef } from 'react'
import { useChannelStore } from '@stores/channelStore'
import { useStompStore } from '@stores/stompStore'
import Input from '@ui/Input'
import Button from '@ui/Button'
import FileUploadButton from './FileUploadButton'
import styles from './MessageInput.module.css'

export default function MessageInput({ text, setText, textareaRef, onInput, onKeyDown }) {
  const fileIdRef = useRef(null)
  const currentChannelId = useChannelStore((s) => s.currentChannelId)
  const channels = useChannelStore((s) => s.channels)
  const currentChannel = channels.find((ch) => ch.id === currentChannelId)
  const sendMessage = useStompStore((s) => s.sendMessage)

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || !currentChannelId) return
    sendMessage(currentChannelId, trimmed, fileIdRef.current)
    setText('')
    fileIdRef.current = null
  }

  function handleChange(e) {
    const newText = e.target.value
    setText(newText)
    onInput?.(newText, e.target.selectionStart)
  }

  function handleKeyDown(e) {
    if (onKeyDown?.(e)) return // 팝업이 이벤트를 소비한 경우
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleFileUploaded(fileId) {
    fileIdRef.current = fileId
  }

  return (
    <Input variant="box">
      <FileUploadButton onUploaded={handleFileUploaded} />
      <textarea
        ref={textareaRef}
        className={styles.field}
        placeholder={
          currentChannel ? `#${currentChannel.name} 에 메시지 보내기...` : '채널을 선택해주세요'
        }
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        rows={1}
        disabled={!currentChannelId}
      />
      <Button
        variant="primary"
        className={styles.send}
        onClick={handleSend}
        disabled={!text.trim()}
      >
        ↑
      </Button>
    </Input>
  )
}
