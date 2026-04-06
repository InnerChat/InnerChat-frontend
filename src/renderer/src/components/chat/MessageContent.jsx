import MarkdownRenderer from './MarkdownRenderer'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MessageContent({ content, attachment }) {
  return (
    <>
      {content && <MarkdownRenderer content={content} />}
      {attachment && (
        attachment.mimeType?.startsWith('image/') ? (
          <img
            src={`${BASE_URL}${attachment.fileUrl}`}
            alt={attachment.fileName}
            style={{ maxWidth: '320px', maxHeight: '240px', borderRadius: '6px', marginTop: '4px' }}
          />
        ) : (
          <a
            href={`${BASE_URL}${attachment.fileUrl}`}
            download={attachment.fileName}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}
          >
            📎 {attachment.fileName}
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8em' }}>
              ({formatFileSize(attachment.fileSize)})
            </span>
          </a>
        )
      )}
    </>
  )
}
