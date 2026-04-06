import Button from '@ui/Button'
import Tooltip from '@ui/Tooltip'
import styles from './FormatToolbar.module.css'

const TOOLS = [
  { label: 'B',    title: '굵게',      style: 'bold' },
  { label: 'I',    title: '기울임',    style: 'italic' },
  { label: '</>', title: '코드블록',  style: 'code' },
  { label: '🔗',  title: '링크',      style: 'link' },
  { label: '😊',  title: '이모지',    style: 'emoji' },
]

export default function FormatToolbar({ onFormat }) {
  return (
    <div className={styles.toolbar}>
      {TOOLS.map((tool) => (
        <Tooltip key={tool.style} text={tool.title} position="top">
          <Button
            variant="tool"
            onClick={() => onFormat?.(tool.style)}
            style={tool.style === 'bold' ? { fontWeight: 700 } : tool.style === 'italic' ? { fontStyle: 'italic' } : {}}
          >
            {tool.label}
          </Button>
        </Tooltip>
      ))}
    </div>
  )
}
