import { useState } from 'react'
import Modal from '@ui/Modal'
import Button from '@ui/Button'
import { useChannelStore } from '@stores/channelStore'
import styles from './ChannelCreateModal.module.css'

export default function ChannelCreateModal({ onClose }) {
  const createChannel = useChannelStore((s) => s.createChannel)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await createChannel({ name, description, isPrivate })
      onClose()
    } catch (err) {
      setError(err.response?.data?.message ?? '채널 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={true} onClose={onClose}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          채널 이름
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            placeholder="예: general"
          />
        </label>
        <label className={styles.label}>
          설명 (선택)
          <input
            className={styles.input}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            placeholder="채널 설명을 입력하세요"
          />
        </label>
        <label className={styles.checkLabel}>
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />
          비공개 채널
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose}>취소</Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? '생성 중...' : '생성'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
