import clsx from 'clsx'
import styles from './Avatar.module.css'

/**
 * @param {'sm'|'md'|'lg'} size
 * @param {'green'|'yellow'|'indigo'|'red'} colorKey
 * @param {string} label - 이니셜 텍스트 (예: 'JK')
 */
export default function Avatar({ size = 'md', colorKey = 'indigo', label = '' }) {
  return (
    <div className={clsx(styles.avatar, styles[size], styles[colorKey])}>
      {label}
    </div>
  )
}
