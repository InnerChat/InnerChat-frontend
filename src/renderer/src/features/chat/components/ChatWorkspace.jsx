/* eslint-disable react/prop-types */
import Avatar from '@ui/Avatar'
import Divider from '@ui/Divider'
import ActionButton from './common/ActionButton'
import MessageGroup from './MessageGroup'
import NavItemButton from './common/NavItemButton'
import styles from './ChatWorkspace.module.css'

const HEADER_ACTIONS = [
  { key: 'search', label: '검색', icon: 'search' },
  { key: 'notification', label: '알림', icon: 'notification' },
  { key: 'members', label: '멤버', icon: 'members' }
]

const INPUT_TOOL_ACTIONS = [
  { key: 'bold', label: '굵게', icon: 'bold' },
  { key: 'italic', label: '기울임', icon: 'italic' },
  { key: 'code', label: '코드블록', icon: 'code' },
  { key: 'link', label: '링크', icon: 'link' },
  { key: 'file', label: '파일', icon: 'file' },
  { key: 'emoji', label: '이모지', icon: 'emoji' }
]

export default function ChatWorkspace({ state }) {
  const {
    workspaceInfo,
    myProfile,
    channels,
    directMessages,
    rightPanelData,
    selectedRoom,
    roomMeta,
    currentMessages,
    isRightPanelOpen,
    draftMessage,
    actions
  } = state

  const roomPrefix = selectedRoom?.type === 'channel' ? '#' : selectedRoom?.type === 'dm' ? '@' : ''

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <header className={styles.workspaceHeader}>
          <h1 className={styles.workspaceName}>{workspaceInfo.name || 'Workspace'}</h1>
          <p className={styles.workspaceSub}>{workspaceInfo.subtitle}</p>
        </header>

        <section className={styles.sidebarSection}>
          <h2 className={styles.sectionLabel}>Channels</h2>
          {channels.map((channel) => (
            <NavItemButton
              key={channel.id}
              icon="#"
              label={channel.name}
              unreadCount={channel.unreadCount}
              isActive={selectedRoom?.type === 'channel' && selectedRoom?.id === channel.id}
              onClick={() => actions.selectChannel(channel.id)}
            />
          ))}
          <NavItemButton icon="+" label="채널 추가" onClick={actions.addChannel} />
        </section>

        <section className={styles.sidebarSection}>
          <h2 className={styles.sectionLabel}>Direct</h2>
          {directMessages.map((dm) => (
            <NavItemButton
              key={dm.id}
              avatar={{ colorKey: dm.colorKey, label: dm.initials }}
              label={dm.name}
              showOnline={dm.isOnline}
              isActive={selectedRoom?.type === 'dm' && selectedRoom?.id === dm.id}
              onClick={() => actions.selectDirectMessage(dm.id)}
            />
          ))}
        </section>

        <footer className={styles.sidebarFooter}>
          <Avatar size="md" colorKey={myProfile.colorKey} label={myProfile.initials} />
          <div>
            <div className={styles.myName}>{myProfile.name}</div>
            <div className={styles.myStatus}>{myProfile.status}</div>
          </div>
        </footer>
      </aside>

      <main className={styles.chatArea}>
        <header className={styles.chatHeader}>
          <span className={styles.headerHash}>{roomPrefix}</span>
          <span className={styles.chatTitle}>{roomMeta.title || '대화 선택'}</span>
          <span className={styles.chatDesc}>{roomMeta.description}</span>

          <div className={styles.headerActions}>
            {HEADER_ACTIONS.map((action) => (
              <ActionButton
                key={action.key}
                variant="icon"
                title={action.label}
                onClick={() => actions.runHeaderAction(action.key)}
              >
                <span
                  aria-hidden="true"
                  className={`${styles.iconGlyph} ${styles[`icon${action.icon}`]}`}
                />
              </ActionButton>
            ))}
            <ActionButton
              variant="icon"
              title={isRightPanelOpen ? '오른쪽 패널 닫기' : '오른쪽 패널 열기'}
              isActive={isRightPanelOpen}
              onClick={actions.toggleRightPanel}
            >
              ▤
            </ActionButton>
          </div>
        </header>

        <section className={styles.messages}>
          {currentMessages.length > 0 ? <Divider label="오늘" /> : null}
          {currentMessages.map((message) => (
            <MessageGroup
              key={message.id}
              message={message}
              onAddReaction={actions.addReaction}
              onOpenThread={actions.openThread}
            />
          ))}
        </section>

        <section className={styles.inputArea}>
          <div className={styles.inputToolbar}>
            {INPUT_TOOL_ACTIONS.map((tool) => (
              <ActionButton
                key={tool.key}
                variant="tool"
                title={tool.label}
                onClick={() => actions.runHeaderAction(tool.key)}
              >
                <span
                  aria-hidden="true"
                  className={`${styles.toolGlyph} ${styles[`icon${tool.icon}`]}`}
                />
              </ActionButton>
            ))}
          </div>

          <form
            className={styles.inputBox}
            onSubmit={(event) => {
              event.preventDefault()
              actions.submitMessage()
            }}
          >
            <input
              className={styles.inputField}
              value={draftMessage}
              placeholder={
                roomMeta.title
                  ? `${roomPrefix}${roomMeta.title}에 메시지 보내기...`
                  : '메시지 보내기...'
              }
              onChange={(event) => actions.setDraftMessage(event.target.value)}
            />
            <button type="submit" className={styles.sendButton}>
              ➤
            </button>
          </form>
        </section>
      </main>

      {isRightPanelOpen ? (
        <aside className={styles.rightPanel}>
          <header className={styles.panelHeader}>
            <span>핀 & 멤버</span>
            <button
              type="button"
              className={styles.panelCloseButton}
              onClick={actions.toggleRightPanel}
            >
              ×
            </button>
          </header>

          <div className={styles.panelContent}>
            <h3 className={styles.panelSectionTitle}>핀 고정 메시지</h3>
            {rightPanelData.pinnedMessages.map((item) => (
              <article key={item.id} className={styles.pinnedItem}>
                <p className={styles.pinnedTitle}>📌 {item.title}</p>
                <p className={styles.pinnedText}>{item.text}</p>
              </article>
            ))}

            <h3 className={styles.panelSectionTitle}>멤버 ({rightPanelData.members.length})</h3>
            {rightPanelData.members.map((member) => (
              <div key={member.id} className={styles.memberItem}>
                <Avatar size="sm" colorKey={member.colorKey} label={member.initials} />
                <span className={styles.memberName}>{member.name}</span>
                {member.isOnline ? <span className={styles.memberOnlineDot} /> : null}
                <span className={styles.memberRole}>{member.role}</span>
              </div>
            ))}
          </div>
        </aside>
      ) : null}
    </div>
  )
}
