import { useRef } from 'react'
import Button from '@ui/Button'
import Tooltip from '@ui/Tooltip'
import { useAuthStore } from '@stores/authStore'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL
const MAX_SIZE_MB = 50

/**
 * 파일 업로드 순서:
 * 1. POST /api/v1/files/upload → fileId 획득
 * 2. onUploaded(fileId) 콜백으로 fileId를 MessageInput에 전달
 * 3. MessageInput이 STOMP 전송 시 content에 fileId 포함
 */
export default function FileUploadButton({ onUploaded }) {
  const inputRef = useRef(null)
  const accessToken = useAuthStore((s) => s.accessToken)

  async function handleChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`파일 크기는 ${MAX_SIZE_MB}MB 이하여야 합니다.`)
      e.target.value = ''
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await axios.post(`${BASE_URL}/api/v1/files/upload`, formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      onUploaded?.(data.fileId)
    } catch (e) {
      console.error('파일 업로드 실패', e)
    } finally {
      e.target.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <Tooltip text="파일 첨부" position="top">
        <Button variant="tool" onClick={() => inputRef.current?.click()}>
          📎
        </Button>
      </Tooltip>
    </>
  )
}
