import { useCallback, useEffect, useMemo, useState } from 'react'
import useStompClient from '@/hooks/useStompClient'
import { useAuthStore } from '@stores/authStore'
import {
  createDmMessageByHttp,
  createDmRoom,
  createDmRoomParticipants,
  readDmMessages,
  readDmRoomList,
  readWorkspaceMembersForDm,
  removeDmRoomParticipant,
  updateLastReadDmMessage
} from '../api/dmApi'

const WORKSPACE_ID = Number(import.meta.env.VITE_WORKSPACE_ID ?? 1)
const STOMP_SEND_DESTINATION = '/app/dm/chat/send'

const INITIAL_LAYOUT_DATA = {
  workspaceInfo: { name: 'InnerChat', subtitle: 'Direct Message' },
  myProfile: { id: '', name: '', initials: '', colorKey: 'indigo', status: 'ONLINE' },
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

function toInitials(name = '') {
  const trimmed = name.trim()
  if (!trimmed) {
    return 'NA'
  }

  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function pickColorKey(seed = 0) {
  const colors = ['indigo', 'green', 'yellow', 'red']
  const index = Math.abs(Number(seed) || 0) % colors.length
  return colors[index]
}

function formatMessageTime(dateLike) {
  const date = new Date(dateLike)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function mapMessage(payload) {
  return {
    id: payload.dmMessageId,
    dmMessageId: payload.dmMessageId,
    clientMessageId: payload.clientMessageId ?? null,
    rawCreatedAt: payload.createdAt,
    authorId: payload.authorId,
    author: {
      name: payload.authorName ?? 'Unknown',
      initials: toInitials(payload.authorName ?? ''),
      colorKey: pickColorKey(payload.authorId)
    },
    time: formatMessageTime(payload.createdAt),
    text: payload.content ?? '',
    reactions: []
  }
}

function upsertMessage(messages, incoming) {
  const withoutTemp = incoming.clientMessageId
    ? messages.filter((message) => message.clientMessageId !== incoming.clientMessageId)
    : messages

  const existingIndex = withoutTemp.findIndex(
    (message) => message.dmMessageId === incoming.dmMessageId
  )
  if (existingIndex >= 0) {
    const cloned = [...withoutTemp]
    cloned[existingIndex] = incoming
    return cloned
  }

  const next = [...withoutTemp, incoming]
  next.sort((a, b) => {
    const dateDiff = new Date(a.rawCreatedAt).getTime() - new Date(b.rawCreatedAt).getTime()
    if (dateDiff !== 0) {
      return dateDiff
    }

    return (a.dmMessageId ?? 0) - (b.dmMessageId ?? 0)
  })
  return next
}

export default function useChatLayoutState() {
  const [layoutData, setLayoutData] = useState(INITIAL_LAYOUT_DATA)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true)
  const [draftMessage, setDraftMessage] = useState('')

  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const { clientRef, isConnected } = useStompClient()

  const currentRoomKey = buildRoomKey(selectedRoom)

  const roomMeta = useMemo(
    () => layoutData.roomMetaByRoomKey[currentRoomKey] ?? { title: '', description: '' },
    [currentRoomKey, layoutData.roomMetaByRoomKey]
  )

  const currentMessages = layoutData.messagesByRoom[currentRoomKey] ?? []

  const loadDmRooms = useCallback(async () => {
    if (!user?.userId) {
      return
    }

    const rooms = await readDmRoomList({ accessToken })

    const mappedDirectMessages = (rooms ?? []).map((room) => {
      const names = Array.isArray(room.participantNameList) ? room.participantNameList : []
      const title = names.join(', ') || `DM ${room.dmRoomId}`

      return {
        id: room.dmRoomId,
        name: title,
        initials: toInitials(title),
        colorKey: pickColorKey(room.dmRoomId),
        isOnline: false,
        unreadCount: Number(room.unreadCount ?? 0)
      }
    })

    const roomMetaByRoomKey = {}
    mappedDirectMessages.forEach((dm) => {
      roomMetaByRoomKey[`dm:${dm.id}`] = {
        title: dm.name,
        description: 'Direct Message'
      }
    })

    setLayoutData((prev) => ({
      ...prev,
      myProfile: {
        id: user.userId,
        name: user.userName ?? '',
        initials: toInitials(user.userName ?? ''),
        colorKey: pickColorKey(user.userId),
        status: 'ONLINE'
      },
      directMessages: mappedDirectMessages,
      roomMetaByRoomKey: {
        ...prev.roomMetaByRoomKey,
        ...roomMetaByRoomKey
      }
    }))

    setSelectedRoom((prev) => {
      if (prev?.type === 'dm' && mappedDirectMessages.some((dm) => dm.id === prev.id)) {
        return prev
      }

      if (mappedDirectMessages.length === 0) {
        return null
      }

      return { type: 'dm', id: mappedDirectMessages[0].id }
    })
  }, [accessToken, user?.userId, user?.userName])

  const loadRoomMessages = useCallback(async () => {
    if (!selectedRoom?.id) {
      return
    }

    const payload = await readDmMessages({
      dmRoomId: selectedRoom.id,
      accessToken
    })

    const messages = Array.isArray(payload?.messages) ? payload.messages.map(mapMessage) : []
    const roomKey = buildRoomKey(selectedRoom)

    setLayoutData((prev) => ({
      ...prev,
      messagesByRoom: {
        ...prev.messagesByRoom,
        [roomKey]: messages
      },
      directMessages: prev.directMessages.map((dm) =>
        dm.id === selectedRoom.id ? { ...dm, unreadCount: 0 } : dm
      )
    }))

    if (user?.userId) {
      await updateLastReadDmMessage({
        dmRoomId: selectedRoom.id,
        accessToken
      }).catch(() => {})
    }
  }, [accessToken, selectedRoom, user?.userId])

  useEffect(() => {
    loadDmRooms().catch((error) => {
      console.error('DM room list load failed', error)
    })
  }, [loadDmRooms])

  useEffect(() => {
    if (selectedRoom?.type !== 'dm') {
      return
    }

    loadRoomMessages().catch((error) => {
      console.error('DM messages load failed', error)
    })
  }, [loadRoomMessages, selectedRoom?.id, selectedRoom?.type])

  useEffect(() => {
    if (!isConnected || selectedRoom?.type !== 'dm' || !selectedRoom.id) {
      return undefined
    }

    const roomId = selectedRoom.id
    const subscription = clientRef.current?.subscribe(`/topic/dm/rooms/${roomId}`, (frame) => {
      const payload = JSON.parse(frame.body)
      const incoming = mapMessage(payload)
      const roomKey = `dm:${roomId}`

      setLayoutData((prev) => ({
        ...prev,
        messagesByRoom: {
          ...prev.messagesByRoom,
          [roomKey]: upsertMessage(prev.messagesByRoom[roomKey] ?? [], incoming)
        }
      }))
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [clientRef, isConnected, selectedRoom?.id, selectedRoom?.type])

  const createOrOpenDmRoom = useCallback(
    async (participantIdList) => {
      if (!Array.isArray(participantIdList) || participantIdList.length === 0) {
        return null
      }

      const normalizedParticipantIds = Array.from(
        new Set([...(user?.userId ? [user.userId] : []), ...participantIdList])
      )

      const response = await createDmRoom({
        workspaceId: WORKSPACE_ID,
        participantIdList: normalizedParticipantIds,
        accessToken
      })

      await loadDmRooms()
      if (response?.dmRoomId) {
        setSelectedRoom({ type: 'dm', id: response.dmRoomId })
      }
      return response
    },
    [accessToken, loadDmRooms, user?.userId]
  )

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
    submitMessage: async () => {
      if (
        !draftMessage.trim() ||
        selectedRoom?.type !== 'dm' ||
        !selectedRoom.id ||
        !user?.userId
      ) {
        return
      }

      const content = draftMessage.trim()
      const clientMessageId = crypto.randomUUID()
      const roomKey = `dm:${selectedRoom.id}`

      setDraftMessage('')

      const client = clientRef.current
      if (!client?.connected) {
        const optimisticMessage = {
          id: `temp:${clientMessageId}`,
          dmMessageId: null,
          clientMessageId,
          rawCreatedAt: new Date().toISOString(),
          authorId: user.userId,
          author: {
            name: user.userName ?? 'Me',
            initials: toInitials(user.userName ?? ''),
            colorKey: pickColorKey(user.userId)
          },
          time: formatMessageTime(new Date().toISOString()),
          text: content,
          reactions: []
        }

        setLayoutData((prev) => ({
          ...prev,
          messagesByRoom: {
            ...prev.messagesByRoom,
            [roomKey]: upsertMessage(prev.messagesByRoom[roomKey] ?? [], optimisticMessage)
          }
        }))

        await createDmMessageByHttp({
          workspaceId: WORKSPACE_ID,
          dmRoomId: selectedRoom.id,
          threadRootMessageId: 0,
          content,
          accessToken
        }).catch(() => {})
        return
      }

      client.publish({
        destination: STOMP_SEND_DESTINATION,
        body: JSON.stringify({
          dmRoomId: selectedRoom.id,
          threadRootMessageId: 0,
          content,
          clientMessageId
        })
      })
    },
    addChannel: () => undefined,
    addReaction: () => undefined,
    openThread: () => undefined,
    runHeaderAction: () => undefined,
    refreshDmRooms: loadDmRooms,
    loadWorkspaceMembersForDm: async () => {
      return readWorkspaceMembersForDm({ workspaceId: WORKSPACE_ID, accessToken })
    },
    lookupExistingDmRoomWithUser: async (participantIdList) => {
      return createOrOpenDmRoom(participantIdList)
    },
    createDmRoom: async (participantIdList) => {
      return createOrOpenDmRoom(participantIdList)
    },
    addDmParticipants: async (dmRoomId, userIdList) => {
      await createDmRoomParticipants({ dmRoomId, userIdList, accessToken })
      await loadDmRooms()
    },
    leaveDmRoom: async (dmRoomId) => {
      await removeDmRoomParticipant({ dmRoomId, accessToken })
      await loadDmRooms()
      setSelectedRoom((prev) => {
        if (prev?.type === 'dm' && prev?.id === dmRoomId) {
          return null
        }
        return prev
      })
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
