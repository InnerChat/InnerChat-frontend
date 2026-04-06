import ChannelHeader from './ChannelHeader'
import MessageFeed from './MessageFeed'
import InputArea from '@/components/input/InputArea'
import styles from './ChatArea.module.css'

export default function ChatArea({ onPinClick, onMemberClick, onSearchClick, onThreadOpen }) {
  return (
    <div className={styles.area}>
      <ChannelHeader onPinClick={onPinClick} onMemberClick={onMemberClick} onSearchClick={onSearchClick} />
      <MessageFeed onThreadOpen={onThreadOpen} />
      <InputArea />
    </div>
  )
}
