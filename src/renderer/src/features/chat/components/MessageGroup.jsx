/* eslint-disable react/prop-types */
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

export default function MessageGroup({ message, onAddReaction, onOpenThread }) {
  return (
    <article className={styles.group}>
      <Avatar size="lg" colorKey={message.author.colorKey} label={message.author.initials} />
      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.name}>{message.author.name}</span>
          <span className={styles.time}>{message.time}</span>
        </div>
        <p className={styles.text}>{renderInlineCode(message.text)}</p>

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
    </article>
  )
}
