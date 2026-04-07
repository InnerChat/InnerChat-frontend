import { useMemo, useState } from 'react'

const INITIAL_LAYOUT_DATA = {
  workspaceInfo: { name: '', subtitle: '' },
  myProfile: { id: '', name: '', initials: '', colorKey: 'indigo', status: '' },
  channels: [],
  directMessages: [],
  roomMetaByRoomKey: {},
  rightPanelData: { pinnedMessages: [], members: [] },
  messagesByRoom: {}
}

function buildRoomKey(room) {
  if (!room?.type || !room?.id) {
    return ''
  }

  return `${room.type}:${room.id}`
}

export default function useChatLayoutState() {
  const [layoutData, setLayoutData] = useState(INITIAL_LAYOUT_DATA)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true)
  const [draftMessage, setDraftMessage] = useState('')

  const currentRoomKey = buildRoomKey(selectedRoom)

  const roomMeta = useMemo(
    () => layoutData.roomMetaByRoomKey[currentRoomKey] ?? { title: '', description: '' },
    [currentRoomKey, layoutData.roomMetaByRoomKey]
  )

  const currentMessages = layoutData.messagesByRoom[currentRoomKey] ?? []

  const actions = {
    selectChannel: (channelId) => setSelectedRoom({ type: 'channel', id: channelId }),
    selectDirectMessage: (dmId) => setSelectedRoom({ type: 'dm', id: dmId }),
    toggleRightPanel: () => setIsRightPanelOpen((prev) => !prev),
    hydrateLayoutData: (payload) =>
      setLayoutData((prev) => ({
        ...prev,
        ...payload
      })),
    setRoomMessages: (room, messages = []) => {
      const roomKey = buildRoomKey(room)

      if (!roomKey) {
        return
      }

      setLayoutData((prev) => ({
        ...prev,
        messagesByRoom: {
          ...prev.messagesByRoom,
          [roomKey]: messages
        }
      }))
    },
    setDraftMessage,
    submitMessage: () => {
      if (!draftMessage.trim()) {
        return
      }

      // TODO: 백엔드 메시지 전송 API 연동
      setDraftMessage('')
    },
    addChannel: () => {
      // TODO: 채널 생성 모달/백엔드 연동
    },
    addReaction: (messageId, emoji) => {
      void messageId
      void emoji
      // TODO: 반응 API 연동
    },
    openThread: (messageId) => {
      void messageId
      // TODO: 스레드 패널/뷰 연동
    },
    runHeaderAction: (actionKey) => {
      void actionKey
      // TODO: 검색/알림/멤버 액션 연동
    }
  }

  return {
    workspaceInfo: layoutData.workspaceInfo,
    myProfile: layoutData.myProfile,
    channels: layoutData.channels,
    directMessages: layoutData.directMessages,
    rightPanelData: layoutData.rightPanelData,
    selectedRoom,
    roomMeta,
    currentMessages,
    isRightPanelOpen,
    draftMessage,
    actions
  }
}
