/* eslint-disable react/prop-types */
import clsx from 'clsx'
import Button from '@ui/Button'
import styles from './ActionButton.module.css'

export default function ActionButton({ variant = 'icon', isActive = false, className, ...props }) {
  return (
    <Button
      variant={variant}
      className={clsx(styles.actionButton, isActive && styles.active, className)}
      {...props}
    />
  )
}
