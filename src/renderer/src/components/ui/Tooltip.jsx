import styles from './Tooltip.module.css'

/**
 * @param {string} text - 툴팁 텍스트
 * @param {'top'|'bottom'} position
 */
export default function Tooltip({ text, position = 'bottom', children }) {
  return (
    <div className={styles.wrapper}>
      {children}
      <span className={`${styles.tooltip} ${styles[position]}`}>{text}</span>
    </div>
  )
}
