import { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import CodeBlock from './CodeBlock'
import styles from './MarkdownRenderer.module.css'

// 코드 블록만 CodeBlock 컴포넌트로 분리, 나머지는 marked 렌더링
const CODE_FENCE = /```(\w*)\n([\s\S]*?)```/g

// @username, #channelname을 하이라이트 span으로 변환 (marked 처리 전)
function highlightEntities(text) {
  return text
    .replace(/@(\w+)/g, '<span class="memoMention">@$1</span>')
    .replace(/#(\w+)/g, '<span class="memoChanRef">#$1</span>')
}

export default function MarkdownRenderer({ content }) {
  const parts = useMemo(() => {
    const result = []
    let lastIndex = 0
    let match

    CODE_FENCE.lastIndex = 0
    while ((match = CODE_FENCE.exec(content)) !== null) {
      if (match.index > lastIndex) {
        result.push({ type: 'text', value: content.slice(lastIndex, match.index) })
      }
      result.push({ type: 'code', lang: match[1] || 'plaintext', value: match[2] })
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < content.length) {
      result.push({ type: 'text', value: content.slice(lastIndex) })
    }

    return result
  }, [content])

  return (
    <div className={styles.wrapper}>
      {parts.map((part, i) =>
        part.type === 'code' ? (
          <CodeBlock key={i} lang={part.lang} code={part.value} />
        ) : (
          <span
            key={i}
            className={styles.text}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(
                marked.parseInline(highlightEntities(part.value)),
                { ALLOWED_ATTR: ['class', 'href', 'target', 'rel'] }
              )
            }}
          />
        )
      )}
    </div>
  )
}
