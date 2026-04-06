import Avatar from '@ui/Avatar'
import styles from './ThreadPreview.module.css'

export default function ThreadPreview({ threadCount, lastAt, participants = [], onOpen }) {
  if (!threadCount) return null

  return (
    <div className={styles.preview} onClick={onOpen}>
      <div className={styles.avatars}>
        {participants.slice(0, 3).map((p, i) => (
          <Avatar key={i} size="sm" colorKey={p.colorKey ?? 'indigo'} label={p.initials} />
        ))}
      </div>
      <span>{threadCount}개 댓글 · {lastAt}</span>
    </div>
  )
}
