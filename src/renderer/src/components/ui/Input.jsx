import clsx from 'clsx'
import styles from './Input.module.css'

/**
 * @param {'default'|'box'} variant
 * - default: 단순 input 요소 (로그인 폼 등)
 * - box: 메시지 입력창 래퍼 (children으로 내부 요소 전달)
 */
export default function Input({ variant = 'default', className, children, ...props }) {
  if (variant === 'box') {
    return (
      <div className={clsx(styles.box, className)}>
        {children}
      </div>
    )
  }

  return (
    <input className={clsx(styles.input, className)} {...props} />
  )
}
