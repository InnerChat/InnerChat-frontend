import WorkspaceName from './WorkspaceName'
import ChannelList from './ChannelList'
import DirectMessageList from './DirectMessageList'
import MyProfile from './MyProfile'
import ScrollArea from '@ui/ScrollArea'
import styles from './ChannelSidebar.module.css'

export default function ChannelSidebar() {
  return (
    <div className={styles.sidebar}>
      <WorkspaceName />
      <ScrollArea className={styles.scroll}>
        <ChannelList />
        <DirectMessageList />
      </ScrollArea>
      <MyProfile />
    </div>
  )
}
