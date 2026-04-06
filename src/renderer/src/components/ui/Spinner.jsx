import clsx from 'clsx'
import styles from './Spinner.module.css'

/**
 * @param {'sm'|'md'} size
 */
export default function Spinner({ size = 'md' }) {
  return <div className={clsx(styles.spinner, styles[size])} />
}
