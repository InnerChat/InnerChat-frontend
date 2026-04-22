/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react'
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
  const messagesRef = useRef(null)
  const [isCreateDmComposerOpen, setIsCreateDmComposerOpen] = useState(false)
  const [workspaceMembers, setWorkspaceMembers] = useState([])
  const [memberQuery, setMemberQuery] = useState('')
  const [selectedDmMembers, setSelectedDmMembers] = useState([])
  const [isLoadingWorkspaceMembers, setIsLoadingWorkspaceMembers] = useState(false)
  const [isCheckingExistingDm, setIsCheckingExistingDm] = useState(false)
  const [inviteUserIds, setInviteUserIds] = useState('')
  const [isSubmittingCreateDm, setIsSubmittingCreateDm] = useState(false)
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false)
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false)

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
  const isDmSelected = selectedRoom?.type === 'dm' && !!selectedRoom?.id

  useEffect(() => {
    const el = messagesRef.current
    if (!el) {
      return
    }

    el.scrollTop = el.scrollHeight
  }, [currentMessages, selectedRoom?.id, selectedRoom?.type])

  function parseUserIds(value) {
    return value
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isInteger(v) && v > 0)
  }

  function normalizeWorkspaceMembers(payload) {
    const source = Array.isArray(payload) ? payload : Array.isArray(payload?.members) ? payload.members : []

    return source
      .map((member) => {
        const id = Number(member?.userId ?? member?.id ?? member?.memberId ?? 0)
        const name =
          member?.userName ?? member?.name ?? member?.nickname ?? (id > 0 ? `User ${id}` : '')

        return {
          id,
          name: String(name).trim()
        }
      })
      .filter((member) => member.id > 0 && member.name)
  }

  async function handleToggleCreateDmComposer() {
    setIsCreateDmComposerOpen((prev) => !prev)

    if (isCreateDmComposerOpen) {
      return
    }

    try {
      setIsLoadingWorkspaceMembers(true)
      const payload = await actions.loadWorkspaceMembersForDm()
      setWorkspaceMembers(normalizeWorkspaceMembers(payload))
    } finally {
      setIsLoadingWorkspaceMembers(false)
    }
  }

  function handleSelectDmMember(member) {
    setSelectedDmMembers((prev) => {
      if (prev.some((item) => item.id === member.id)) {
        return prev
      }
      return [...prev, member]
    })
    setMemberQuery('')
  }

  function handleRemoveDmMember(memberId) {
    setSelectedDmMembers((prev) => prev.filter((item) => item.id !== memberId))
  }

  async function handleCreateDm(event) {
    event.preventDefault()
    const participantIdList = selectedDmMembers.map((member) => member.id)
    if (participantIdList.length === 0) {
      return
    }

    try {
      setIsSubmittingCreateDm(true)
      await actions.createDmRoom(participantIdList)
      setSelectedDmMembers([])
      setMemberQuery('')
      setIsCreateDmComposerOpen(false)
    } finally {
      setIsSubmittingCreateDm(false)
    }
  }

  async function handleInviteParticipants(event) {
    event.preventDefault()
    if (!isDmSelected) {
      return
    }

    const userIdList = parseUserIds(inviteUserIds)
    if (userIdList.length === 0) {
      return
    }

    try {
      setIsSubmittingInvite(true)
      await actions.addDmParticipants(selectedRoom.id, userIdList)
      setInviteUserIds('')
    } finally {
      setIsSubmittingInvite(false)
    }
  }

  async function handleLeaveRoom() {
    if (!isDmSelected) {
      return
    }

    try {
      setIsSubmittingLeave(true)
      await actions.leaveDmRoom(selectedRoom.id)
    } finally {
      setIsSubmittingLeave(false)
    }
  }

  useEffect(() => {
    if (!isCreateDmComposerOpen) {
      return undefined
    }

    const keyword = memberQuery.trim()
    if (!keyword) {
      return undefined
    }

    const timer = setTimeout(async () => {
      try {
        setIsCheckingExistingDm(true)
        const existingDm = await actions.lookupExistingDmRoomWithUser(
          selectedDmMembers.map((member) => member.id)
        )
        if (existingDm?.dmRoomId) {
          actions.selectDirectMessage(existingDm.dmRoomId)
          setIsCreateDmComposerOpen(false)
        }
      } finally {
        setIsCheckingExistingDm(false)
      }
    }, 250)

    return () => {
      clearTimeout(timer)
    }
  }, [actions, isCreateDmComposerOpen, memberQuery, selectedDmMembers])

  const selectedDmMemberIdSet = new Set(selectedDmMembers.map((member) => member.id))
  const filteredWorkspaceMembers = workspaceMembers
    .filter((member) => {
      if (selectedDmMemberIdSet.has(member.id)) {
        return false
      }

      const keyword = memberQuery.trim()
      if (!keyword) {
        return true
      }

      return member.name.toLowerCase().includes(keyword.toLowerCase()) || String(member.id).includes(keyword)
    })
    .slice(0, 8)

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
          <div className={styles.sectionLabelRow}>
            <h2 className={styles.sectionLabel}>Direct</h2>
            <button
              type="button"
              className={styles.sectionAddButton}
              onClick={handleToggleCreateDmComposer}
              title="DM 추가"
            >
              +
            </button>
          </div>
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

          {isCreateDmComposerOpen ? (
            <form className={styles.dmComposer} onSubmit={handleCreateDm}>
              {selectedDmMembers.length > 0 ? (
                <div className={styles.dmMemberChipList}>
                  {selectedDmMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      className={styles.dmMemberChip}
                      onClick={() => handleRemoveDmMember(member.id)}
                      title="선택 해제"
                    >
                      <span>{member.name}</span>
                      <span className={styles.dmChipRemove}>×</span>
                    </button>
                  ))}
                </div>
              ) : null}

              <input
                className={styles.dmComposerInput}
                value={memberQuery}
                placeholder="이름으로 멤버 검색"
                onChange={(event) => setMemberQuery(event.target.value)}
              />

              {memberQuery.trim() ? (
                <div className={styles.dmSuggestionList}>
                  {filteredWorkspaceMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      className={styles.dmSuggestionItem}
                      onClick={() => handleSelectDmMember(member)}
                    >
                      <span>{member.name}</span>
                      <span className={styles.dmSuggestionMeta}>#{member.id}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {isLoadingWorkspaceMembers ? (
                <p className={styles.dmHelperText}>멤버 목록 불러오는 중...</p>
              ) : null}
              {isCheckingExistingDm ? (
                <p className={styles.dmHelperText}>기존 DM 확인 중...</p>
              ) : null}

              <button
                className={styles.inlineButton}
                type="submit"
                disabled={isSubmittingCreateDm || selectedDmMembers.length === 0}
              >
                {isSubmittingCreateDm ? '생성중' : 'DM 생성'}
              </button>
            </form>
          ) : null}
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

        <section ref={messagesRef} className={styles.messages}>
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

            {isDmSelected ? (
              <>
                <h3 className={styles.panelSectionTitle}>참여자 관리</h3>
                <form className={styles.panelForm} onSubmit={handleInviteParticipants}>
                  <input
                    className={styles.panelInput}
                    value={inviteUserIds}
                    placeholder="추가 userId (쉼표 구분)"
                    onChange={(event) => setInviteUserIds(event.target.value)}
                  />
                  <button
                    className={styles.panelPrimaryButton}
                    type="submit"
                    disabled={isSubmittingInvite}
                  >
                    {isSubmittingInvite ? '추가중' : '참여자 추가'}
                  </button>
                </form>

                <button
                  type="button"
                  className={styles.panelDangerButton}
                  onClick={handleLeaveRoom}
                  disabled={isSubmittingLeave}
                >
                  {isSubmittingLeave ? '처리중' : '방 나가기'}
                </button>
              </>
            ) : null}
          </div>
        </aside>
      ) : null}
    </div>
  )
}
