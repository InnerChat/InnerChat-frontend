/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react'
import Avatar from '@ui/Avatar'
import Divider from '@ui/Divider'
import ActionButton from './common/ActionButton'
import MessageGroup from './MessageGroup'
import NavItemButton from './common/NavItemButton'
import styles from './ChatWorkspace.module.css'

const HEADER_ACTIONS = [{ key: 'search', label: '검색', icon: 'search' }]

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
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteMemberQuery, setInviteMemberQuery] = useState('')
  const [selectedInviteMembers, setSelectedInviteMembers] = useState([])
  const [isSubmittingCreateDm, setIsSubmittingCreateDm] = useState(false)
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false)
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false)
  const [dmContextMenu, setDmContextMenu] = useState(null)
  const [isCreateChannelComposerOpen, setIsCreateChannelComposerOpen] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [isSubmittingCreateChannel, setIsSubmittingCreateChannel] = useState(false)
  const [invitingChannelId, setInvitingChannelId] = useState(null)
  const [inviteChannelQuery, setInviteChannelQuery] = useState('')
  const [isSubmittingChannelInvite, setIsSubmittingChannelInvite] = useState(false)

  const {
    workspaceInfo,
    myProfile,
    channels,
    directMessages,
    selectedDmRoomType,
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
  const isGroupDm = selectedDmRoomType === 'GROUP'

  useEffect(() => {
    const el = messagesRef.current
    if (!el) {
      return
    }

    el.scrollTop = el.scrollHeight
  }, [currentMessages, selectedRoom?.id, selectedRoom?.type])

  useEffect(() => {
    if (!dmContextMenu) {
      return undefined
    }

    function handleWindowClick() {
      setDmContextMenu(null)
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setDmContextMenu(null)
      }
    }

    window.addEventListener('click', handleWindowClick)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('click', handleWindowClick)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [dmContextMenu])

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

  async function ensureWorkspaceMembersLoaded() {
    if (workspaceMembers.length > 0) {
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

  async function handleToggleCreateDmComposer() {
    const willOpen = !isCreateDmComposerOpen
    setIsCreateDmComposerOpen(willOpen)

    if (!willOpen) {
      return
    }

    await ensureWorkspaceMembersLoaded()
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

  async function handleOpenInviteModal() {
    if (!isGroupDm) {
      return
    }

    await ensureWorkspaceMembersLoaded()
    setSelectedInviteMembers([])
    setInviteMemberQuery('')
    setIsInviteModalOpen(true)
  }

  function handleCloseInviteModal() {
    setIsInviteModalOpen(false)
    setSelectedInviteMembers([])
    setInviteMemberQuery('')
  }

  function handleSelectInviteMember(member) {
    setSelectedInviteMembers((prev) => {
      if (prev.some((item) => item.id === member.id)) {
        return prev
      }
      return [...prev, member]
    })
    setInviteMemberQuery('')
  }

  function handleRemoveInviteMember(memberId) {
    setSelectedInviteMembers((prev) => prev.filter((item) => item.id !== memberId))
  }

  async function handleInviteParticipants(event) {
    event.preventDefault()
    if (!isDmSelected) {
      return
    }

    const userIdList = selectedInviteMembers.map((member) => member.id)
    if (userIdList.length === 0) {
      return
    }

    try {
      setIsSubmittingInvite(true)
      await actions.addDmParticipants(selectedRoom.id, userIdList)
      handleCloseInviteModal()
    } finally {
      setIsSubmittingInvite(false)
    }
  }

  async function handleInviteToChannel(channelId, member) {
    try {
      setIsSubmittingChannelInvite(true)
      await actions.inviteToChannel(channelId, member.id)
      setInviteChannelQuery('')
      setInvitingChannelId(null)
    } finally {
      setIsSubmittingChannelInvite(false)
    }
  }

  async function handleCreateChannel(event) {
    event.preventDefault()
    if (!newChannelName.trim()) return
    try {
      setIsSubmittingCreateChannel(true)
      await actions.createChannel({ channelName: newChannelName })
      setNewChannelName('')
      setIsCreateChannelComposerOpen(false)
    } finally {
      setIsSubmittingCreateChannel(false)
    }
  }

  async function handleDeleteChannel() {
    if (selectedRoom?.type !== 'channel' || !selectedRoom?.id) return
    try {
      // 채널과 DM은 동시에 선택될 수 없으므로 isSubmittingLeave를 공유해도 안전하다.
      setIsSubmittingLeave(true)
      await actions.deleteChannel(selectedRoom.id)
    } finally {
      setIsSubmittingLeave(false)
    }
  }

  async function handleLeaveRoom(dmRoomId = selectedRoom?.id) {
    if (!dmRoomId || !isDmSelected) {
      return
    }

    try {
      setIsSubmittingLeave(true)
      await actions.leaveDmRoom(dmRoomId)
    } finally {
      setIsSubmittingLeave(false)
    }
  }

  function handleOpenDmContextMenu(event, dmRoomId) {
    event.preventDefault()
    setDmContextMenu({
      roomId: dmRoomId,
      x: event.clientX,
      y: event.clientY
    })
  }

  async function handleLeaveRoomFromContextMenu() {
    if (!dmContextMenu?.roomId || isSubmittingLeave) {
      return
    }

    const roomId = dmContextMenu.roomId
    setDmContextMenu(null)
    await handleLeaveRoom(roomId)
  }

  useEffect(() => {
    if (!invitingChannelId || workspaceMembers.length > 0) return
    actions.loadWorkspaceMembersForDm().then((payload) => {
      setWorkspaceMembers(normalizeWorkspaceMembers(payload))
    })
  }, [invitingChannelId, actions, workspaceMembers.length])

  const selectedDmMemberIdSet = new Set(selectedDmMembers.map((member) => member.id))
  const filteredWorkspaceMembers = workspaceMembers
    .filter((member) => {
      if (selectedDmMemberIdSet.has(member.id)) {
        return false
      }

      const keyword = memberQuery.trim().toLowerCase()
      if (!keyword) {
        return true
      }

      return member.name.toLowerCase().includes(keyword)
    })
    .slice(0, 8)

  const selectedInviteMemberIdSet = new Set(selectedInviteMembers.map((member) => member.id))
  const filteredInviteMembers = workspaceMembers
    .filter((member) => {
      if (selectedInviteMemberIdSet.has(member.id)) {
        return false
      }

      const keyword = inviteMemberQuery.trim().toLowerCase()
      if (!keyword) {
        return true
      }

      return member.name.toLowerCase().includes(keyword)
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
          <div className={styles.sectionLabelRow}>
            <h2 className={styles.sectionLabel}>Channels</h2>
            <button
              type="button"
              className={styles.sectionAddButton}
              onClick={() => setIsCreateChannelComposerOpen((prev) => !prev)}
              title="채널 추가"
            >
              +
            </button>
          </div>
          {channels.map((channel) => (
            <div key={channel.id}>
              <div className={styles.channelRow}>
                <NavItemButton
                  icon="#"
                  label={channel.name}
                  unreadCount={channel.unreadCount}
                  isActive={selectedRoom?.type === 'channel' && selectedRoom?.id === channel.id}
                  onClick={() => actions.selectChannel(channel.id)}
                />
                {channel.isMember && (
                  <button
                    type="button"
                    className={styles.channelInviteButton}
                    title="멤버 초대"
                    onClick={() =>
                      setInvitingChannelId((prev) => (prev === channel.id ? null : channel.id))
                    }
                  >
                    +
                  </button>
                )}
              </div>
              {invitingChannelId === channel.id && (
                <div className={styles.dmComposer}>
                  <input
                    className={styles.dmComposerInput}
                    placeholder="이름으로 멤버 검색"
                    value={inviteChannelQuery}
                    onChange={(e) => setInviteChannelQuery(e.target.value)}
                    autoFocus
                  />
                  {inviteChannelQuery.trim() && (
                    <ul className={styles.memberList}>
                      {workspaceMembers
                        .filter((m) =>
                          m.name.toLowerCase().includes(inviteChannelQuery.trim().toLowerCase())
                        )
                        .slice(0, 6)
                        .map((m) => (
                          <li key={m.id}>
                            <button
                              type="button"
                              className={styles.memberItem}
                              disabled={isSubmittingChannelInvite}
                              onClick={() => handleInviteToChannel(channel.id, m)}
                            >
                              {m.name}
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
          {/* dmComposer / dmComposerInput 클래스는 DM 폼과 동일한 스타일을 재사용 */}
          {isCreateChannelComposerOpen ? (
            <form className={styles.dmComposer} onSubmit={handleCreateChannel}>
              <input
                className={styles.dmComposerInput}
                placeholder="채널 이름"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className={styles.inlineButton}
                disabled={isSubmittingCreateChannel || !newChannelName.trim()}
              >
                {isSubmittingCreateChannel ? '생성 중...' : '채널 생성'}
              </button>
            </form>
          ) : null}
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
              unreadCount={dm.unreadCount}
              showOnline={dm.isOnline}
              isActive={selectedRoom?.type === 'dm' && selectedRoom?.id === dm.id}
              onClick={() => actions.selectDirectMessage(dm)}
              onContextMenu={(event) => handleOpenDmContextMenu(event, dm.id)}
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
                    </button>
                  ))}
                </div>
              ) : null}

              {isLoadingWorkspaceMembers ? (
                <p className={styles.dmHelperText}>멤버 목록 불러오는 중...</p>
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
              title={isRightPanelOpen ? '핀 리스트 닫기' : '핀 리스트 열기'}
              isActive={isRightPanelOpen}
              onClick={actions.toggleRightPanel}
            >
              <span aria-hidden="true" className={`${styles.iconGlyph} ${styles.iconpin}`} />
            </ActionButton>
            {isGroupDm ? (
              <ActionButton variant="icon" title="참여자 추가" onClick={handleOpenInviteModal}>
                <span aria-hidden="true" className={`${styles.iconGlyph} ${styles.iconadd}`} />
              </ActionButton>
            ) : null}
          </div>
        </header>

        <section ref={messagesRef} className={styles.messages}>
          {currentMessages.length > 0 ? <Divider label="오늘" /> : null}
          {currentMessages.map((message) => (
            <MessageGroup
              key={message.id}
              message={message}
              currentUserId={myProfile.id}
              onAddReaction={actions.addReaction}
              onOpenThread={actions.openThread}
              onEditMessage={actions.editDmMessage}
              onDeleteMessage={actions.deleteDmMessage}
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
            <span>핀 리스트</span>
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
            {rightPanelData.pinnedMessages.length > 0 ? (
              rightPanelData.pinnedMessages.map((item) => (
                <article key={item.id} className={styles.pinnedItem}>
                  <p className={styles.pinnedTitle}>📌 {item.title}</p>
                  <p className={styles.pinnedText}>{item.text}</p>
                </article>
              ))
            ) : (
              <p className={styles.dmHelperText}>핀 고정된 메시지가 없습니다.</p>
            )}
          </div>
        </aside>
      ) : null}

      {dmContextMenu ? (
        <div
          className={styles.contextMenu}
          style={{ top: `${dmContextMenu.y}px`, left: `${dmContextMenu.x}px` }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className={styles.contextMenuDanger}
            onClick={handleLeaveRoomFromContextMenu}
            disabled={isSubmittingLeave}
          >
            {isSubmittingLeave ? '처리중' : '방 나가기'}
          </button>
        </div>
      ) : null}

      {isInviteModalOpen ? (
        <div className={styles.modalOverlay} onClick={handleCloseInviteModal}>
          <div
            className={styles.modalCard}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="참여자 추가"
          >
            <header className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>참여자 추가</h3>
              <button type="button" className={styles.panelCloseButton} onClick={handleCloseInviteModal}>
                ×
              </button>
            </header>
            {selectedRoom?.type === 'channel' && selectedRoom?.id ? (
              <>
                <h3 className={styles.panelSectionTitle}>채널 관리</h3>
                <button
                  type="button"
                  className={styles.panelDangerButton}
                  onClick={handleDeleteChannel}
                  disabled={isSubmittingLeave}
                >
                  {isSubmittingLeave ? '삭제 중...' : '채널 삭제'}
                </button>
              </>
            ) : null}

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

            <form className={styles.modalForm} onSubmit={handleInviteParticipants}>
              {selectedInviteMembers.length > 0 ? (
                <div className={styles.dmMemberChipList}>
                  {selectedInviteMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      className={styles.dmMemberChip}
                      onClick={() => handleRemoveInviteMember(member.id)}
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
                value={inviteMemberQuery}
                placeholder="이름으로 멤버 검색"
                onChange={(event) => setInviteMemberQuery(event.target.value)}
              />

              {inviteMemberQuery.trim() ? (
                <div className={styles.dmSuggestionList}>
                  {filteredInviteMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      className={styles.dmSuggestionItem}
                      onClick={() => handleSelectInviteMember(member)}
                    >
                      <span>{member.name}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {isLoadingWorkspaceMembers ? (
                <p className={styles.dmHelperText}>멤버 목록 불러오는 중...</p>
              ) : null}

              <div className={styles.modalActions}>
                <button type="button" className={styles.modalGhostButton} onClick={handleCloseInviteModal}>
                  취소
                </button>
                <button
                  type="submit"
                  className={styles.panelPrimaryButton}
                  disabled={isSubmittingInvite || selectedInviteMembers.length === 0}
                >
                  {isSubmittingInvite ? '추가중' : '참여자 추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
