import { useEffect, useState } from 'react'
import { codeToHtml } from 'shiki'
import styles from './CodeBlock.module.css'

export default function CodeBlock({ lang = 'plaintext', code }) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    codeToHtml(code, {
      lang,
      theme: 'catppuccin-mocha'
    })
      .then(setHtml)
      .catch(() => setHtml(`<pre>${code}</pre>`))
  }, [lang, code])

  function handleCopy() {
    navigator.clipboard.writeText(code)
  }

  return (
    <div className={styles.block}>
      <div className={styles.langBar}>
        <span>{lang}</span>
        <button className={styles.copy} onClick={handleCopy}>복사</button>
      </div>
      <div
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
