import { useEffect } from 'react'
import { useChannelStore } from '@stores/channelStore'
import styles from './WorkspaceName.module.css'

export default function WorkspaceName() {
  const workspace = useChannelStore((s) => s.workspace)
  const fetchWorkspace = useChannelStore((s) => s.fetchWorkspace)

  useEffect(() => { fetchWorkspace() }, [])

  return (
    <div className={styles.header}>
      <div className={styles.name}>{workspace?.name ?? '...'}</div>
      <div className={styles.sub}>
        {workspace ? `On-premise · ${workspace.memberCount}명` : ''}
      </div>
    </div>
  )
}
