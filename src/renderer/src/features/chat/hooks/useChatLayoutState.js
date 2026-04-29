import { Profiler, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useStompClient from '@/hooks/useStompClient'
import { useAuthStore } from '@stores/authStore'
import {
  createDmRoom,
  createDmRoomParticipants,
  deleteDmMessage,
  readDmMessages,
  readDmRoomList,
  readWorkspaceMembersForDm,
  removeDmRoomParticipant,
  updateDmMessage,
  updateLastReadDmMessage
} from '../api/dmApi'
import { readChannelListUserId, readChannelMembers, readChannelMessages, createChannel, deleteChannel, leaveChannel, inviteToChannel, editChannelMessage, deleteChannelMessage } from '../api/channelApi'

const WORKSPACE_ID = Number(import.meta.env.VITE_WORKSPACE_ID)
const STOMP_SEND_DESTINATION = '/app/dm/chat/send'
const STOMP_UPDATE_DESTINATION = '/app/dm/chat/update'
const STOMP_DELETE_DESTINATION = '/app/dm/chat/delete'
const STOMP_CHANNEL_SEND_DESTINATION = '/app/channel/send'

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
  const status = String(payload.status ?? payload.messageStatus ?? '').toLowerCase()

  return {
    id: payload.dmMessageId,
    dmMessageId: payload.dmMessageId,
    rawCreatedAt: payload.createdAt,
    authorId: payload.authorId,
    author: {
      name: payload.authorName ?? 'Unknown',
      initials: toInitials(payload.authorName ?? ''),
      colorKey: pickColorKey(payload.authorId)
    },
    time: formatMessageTime(payload.createdAt),
    text: payload.content ?? '',
    status,
    reactions: []
  }
}

function upsertMessage(messages, incoming) {
  const existingIndex = messages.findIndex(
    (message) => message.dmMessageId === incoming.dmMessageId
  )
  if (existingIndex >= 0) {
    const cloned = [...messages]
    cloned[existingIndex] = incoming
    return cloned
  }

  const next = [...messages, incoming]
  next.sort((a, b) => {
    const dateDiff = new Date(a.rawCreatedAt).getTime() - new Date(b.rawCreatedAt).getTime()
    if (dateDiff !== 0) {
      return dateDiff
    }

    return (a.dmMessageId ?? 0) - (b.dmMessageId ?? 0)
  })
  return next
}

function updateMessageContent(messages, dmMessageId, content, rawDate = new Date().toISOString()) {
  const targetId = Number(dmMessageId)
  if (!targetId) {
    return messages
  }

  return messages.map((message) => {
    if (Number(message.dmMessageId) !== targetId) {
      return message
    }

    return {
      ...message,
      text: String(content ?? message.text ?? ''),
      rawCreatedAt: rawDate,
      time: formatMessageTime(rawDate),
      status: 'modified'
    }
  })
}

function removeMessage(messages, dmMessageId) {
  const targetId = Number(dmMessageId)
  if (!targetId) {
    return messages
  }

  return messages.filter((message) => Number(message.dmMessageId) !== targetId)
}

function isUnreadTriggerDmEvent(event = {}) {
  const eventType = String(event?.eventType ?? '')
  const dmMessageId = Number(event?.dmMessageId ?? 0)

  if (dmMessageId > 0) {
    return true
  }

  return eventType.includes('MESSAGE')
}

export default function useChatLayoutState() {
  const [layoutData, setLayoutData] = useState(INITIAL_LAYOUT_DATA)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true)
  const [draftMessage, setDraftMessage] = useState('')

  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const { clientRef, isConnected } = useStompClient()
  const dmRoomRefreshTimerRef = useRef(null)
  const dmRoomIdsRef = useRef(new Set())
  const dmRoomNoticeDedupRef = useRef(new Set())
  const dmInboxEventDedupRef = useRef(new Set())
  const dmRoomTopicSubscriptionsRef = useRef(new Map())
  const activeDmRoomIdsKeyRef = useRef('')
  const selectedRoomRef = useRef(selectedRoom)

  const currentRoomKey = buildRoomKey(selectedRoom)
  const selectedDmRoomType = selectedRoom?.type === 'dm' ? selectedRoom?.dmRoomType ?? '' : ''

  const roomMeta = useMemo(
    () => layoutData.roomMetaByRoomKey[currentRoomKey] ?? { title: '', description: '' },
    [currentRoomKey, layoutData.roomMetaByRoomKey]
  )

  const currentMessages = layoutData.messagesByRoom[currentRoomKey] ?? []

  useEffect(() => {
    selectedRoomRef.current = selectedRoom
  }, [selectedRoom])

  useEffect(() => {
    dmRoomIdsRef.current = new Set((layoutData.directMessages ?? []).map((dm) => Number(dm.id)))
  }, [layoutData.directMessages])

  const loadDmRooms = useCallback(async () => {
    const rooms = await readDmRoomList({ accessToken })
    console.log('[DM rooms loaded]', {
      roomCount: Array.isArray(rooms) ? rooms.length : 0,
      sampleRoomId:
        Array.isArray(rooms) && rooms.length > 0
          ? (rooms[0]?.dmRoomId ?? rooms[0]?.roomId ?? null)
          : null,
      hasUserId: Boolean(user?.userId)
    })

    const mappedDirectMessages = (rooms ?? []).map((room) => {
      const names = Array.isArray(room.participantNameList) ? room.participantNameList : []
      const title = names.join(', ') || `DM ${room.dmRoomId}`
      const dmRoomType = room.dmRoomType

      return {
        id: room.dmRoomId,
        name: title,
        initials: toInitials(title),
        colorKey: pickColorKey(room.dmRoomId),
        isOnline: false,
        unreadCount: Number(room.unreadCount ?? 0),
        dmRoomType
      }
    })
    console.log(
      '[DM room type sample]',
      mappedDirectMessages.slice(0, 5).map((dm) => ({ id: dm.id, dmRoomType: dm.dmRoomType }))
    )

    const roomMetaByRoomKey = {}
    mappedDirectMessages.forEach((dm) => {
      roomMetaByRoomKey[`dm:${dm.id}`] = {
        title: dm.name,
        description: 'Direct Message'
      }
    })

    setLayoutData((prev) => {
      const prevDmById = new Map((prev.directMessages ?? []).map((dm) => [Number(dm.id), dm]))
      const serverDmIdSet = new Set(mappedDirectMessages.map((dm) => Number(dm.id)))
      const selectedDmId =
        selectedRoomRef.current?.type === 'dm' ? Number(selectedRoomRef.current.id) : 0

      const directMessages = mappedDirectMessages.map((dm) => {
        const prevDm = prevDmById.get(Number(dm.id))
        const isActiveRoom = selectedDmId > 0 && Number(dm.id) === selectedDmId
        const unreadCount = isActiveRoom
          ? 0
          : Math.max(Number(dm.unreadCount ?? 0), Number(prevDm?.unreadCount ?? 0))

        return {
          ...dm,
          unreadCount
        }
      })
      const preservedDirectMessages = (prev.directMessages ?? [])
        .filter((dm) => {
          const dmId = Number(dm?.id)
          if (!Number.isInteger(dmId) || dmId <= 0) {
            return false
          }
          if (serverDmIdSet.has(dmId)) {
            return false
          }
          return Number(dm?.unreadCount ?? 0) > 0
        })
        .map((dm) => ({
          ...dm,
          unreadCount: Math.max(0, Number(dm.unreadCount ?? 0))
        }))

      return {
        ...prev,
        myProfile: user?.userId
          ? {
              id: user.userId,
              name: user.userName ?? '',
              initials: toInitials(user.userName ?? ''),
              colorKey: pickColorKey(user.userId),
              status: 'ONLINE'
            }
          : prev.myProfile,
        directMessages: [...preservedDirectMessages, ...directMessages],
        roomMetaByRoomKey: {
          ...prev.roomMetaByRoomKey,
          ...roomMetaByRoomKey
        }
      }
    })

    setSelectedRoom((prev) => {
      if (mappedDirectMessages.length === 0) {
        return null
      }

      if (prev?.type === 'dm') {
        const matched = mappedDirectMessages.find((dm) => dm.id === prev.id)
        if (matched) {
          return { type: 'dm', id: matched.id, dmRoomType: matched.dmRoomType }
        }
      }

      const firstDm = mappedDirectMessages[0]
      return { type: 'dm', id: firstDm.id, dmRoomType: firstDm.dmRoomType }
    })
  }, [accessToken, user?.userId, user?.userName])

  const loadChannels = useCallback(async () => {
    if (!accessToken) return
    try {
      // const raw = await readChannelList({ workspaceId: WORKSPACE_ID, accessToken })
      const raw = await readChannelListUserId({accessToken})    
      const channels = raw.map((ch) => ({
        id: ch.channelId,
        name: ch.name,
        description: ch.description,
        type: ch.type,
        ownerId: ch.ownerId,
        memberCount: ch.memberCount,
        isMember: ch.member ?? false,
        unreadCount: 0
      }))
      // roomMetaByRoomKey에 채널 메타를 함께 주입해야 채널 선택 시
      // 채팅 헤더의 roomMeta.title이 채널명을 즉시 표시할 수 있다.
      const channelRoomMeta = {}
      channels.forEach((ch) => {
        channelRoomMeta[`channel:${ch.id}`] = {
          title: ch.name,
          description: ch.description || '채널'
        }
      })
      setLayoutData((prev) => ({
        ...prev,
        channels,
        roomMetaByRoomKey: {
          ...prev.roomMetaByRoomKey,
          ...channelRoomMeta
        }
      }))
    } catch (error) {
      console.error('채널 목록 로드 실패', error)
    }
  }, [accessToken])

  const loadChannelMembers = useCallback(async (channelId) => {
    if (!accessToken || !channelId) return
    try {
      const raw = await readChannelMembers({ channelId, accessToken })
      console.log(raw);
      const members = raw.map((m) => ({
        id: m.userId,
        name: m.userName ?? `User ${m.userId}`,
        initials: m.userName
          ? m.userName.trim().slice(0, 2).toUpperCase()
          : String(m.userId).slice(0, 2),
        colorKey: pickColorKey(m.userId),
        isOnline: false,
        role: ''
      }))
      setLayoutData((prev) => ({
        ...prev,
        rightPanelData: { ...prev.rightPanelData, members }
      }))
    } catch (error) {
      console.error('채널 멤버 로드 실패', error)
    }
  }, [accessToken])

  const loadChannelMessages = useCallback(async (channelId) => {
    if (!accessToken || !channelId) return
    try {
      const raw = await readChannelMessages({ channelId, accessToken })
      const messages = raw.reverse().map((m) => ({
        id: m.channelMessageId,
        channelMessageId: m.channelMessageId,
        rawCreatedAt: m.createdAt,
        authorId: m.authorId,
        author: {
          name: m.authorName ?? 'Unknown',
          initials: toInitials(m.authorName ?? ''),
          colorKey: pickColorKey(m.authorId)
        },
        time: formatMessageTime(m.createdAt),
        text: m.content ?? '',
        reactions: []
      }))
      const roomKey = `channel:${channelId}`
      setLayoutData((prev) => ({
        ...prev,
        messagesByRoom: { ...prev.messagesByRoom, [roomKey]: messages }
      }))
    } catch (error) {
      console.error('채널 메시지 로드 실패', error)
    }
  }, [accessToken])

  const loadRoomMessages = useCallback(async () => {
    const dmRoomId = Number(selectedRoom?.id)
    if (!dmRoomId || Number.isNaN(dmRoomId)) {
      return
    }

    const payload = await readDmMessages({
      dmRoomId,
      accessToken
    })

    const rawMessages = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.messages)
        ? payload.messages
        : []
    const messages = rawMessages.map(mapMessage)
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
        dmRoomId,
        accessToken
      }).catch(() => {})
    }
  }, [accessToken, selectedRoom, user?.userId])

  useEffect(() => {
    loadDmRooms().catch((error) => {
      console.error('DM room list load failed', error)
    })
    loadChannels().catch((error) => {
      console.error('Channel list load failed', error)
    })
  }, [loadDmRooms, loadChannels])

  useEffect(() => {
    if (selectedRoom?.type !== 'dm') {
      return
    }

    loadRoomMessages().catch((error) => {
      console.error('DM messages load failed', error)
    })
  }, [loadRoomMessages, selectedRoom?.id, selectedRoom?.type])

  useEffect(() => {
    if (selectedRoom?.type !== 'channel' || !selectedRoom?.id) {
      if (selectedRoom?.type !== 'channel') {
        setLayoutData((prev) => ({
          ...prev,
          rightPanelData: { ...prev.rightPanelData, members: [] }
        }))
      }
      return
    }
    loadChannelMembers(selectedRoom.id).catch((error) => {
      console.error('Channel members load failed', error)
    })
  }, [loadChannelMembers, selectedRoom?.id, selectedRoom?.type])

  useEffect(() => {
    if (selectedRoom?.type !== 'channel' || !selectedRoom?.id) return
    loadChannelMessages(selectedRoom.id).catch((error) => {
      console.error('Channel messages load failed', error)
    })
  }, [loadChannelMessages, selectedRoom?.id, selectedRoom?.type])

  const handleDmRoomFrame = useCallback((roomId, frame) => {
    try {
      const payload = JSON.parse(frame.body)
    const roomKey = `dm:${roomId}`
    const eventType = String(payload?.eventType ?? '').toUpperCase()
    const isDeleteEvent = eventType.includes('DELETE')
    const isUpdateEvent = eventType.includes('UPDATE') || eventType.includes('MODIFY')
    const incoming = mapMessage(payload)
    const nextContent = payload?.content ?? payload?.message ?? ''
    const messageId = Number(payload?.dmMessageId ?? incoming?.dmMessageId ?? 0)

    setLayoutData((prev) => {
      const selectedDmId =
        selectedRoomRef.current?.type === 'dm' ? Number(selectedRoomRef.current.id) : 0
      const isActiveRoom = selectedDmId > 0 && selectedDmId === Number(roomId)
      const prevRoomMessages = prev.messagesByRoom[roomKey] ?? []

      let nextRoomMessages = prevRoomMessages
      if (isDeleteEvent) {
        nextRoomMessages = removeMessage(prevRoomMessages, messageId)
      } else if (isUpdateEvent) {
        nextRoomMessages = updateMessageContent(
          prevRoomMessages,
          messageId,
          nextContent,
          payload?.updatedAt ?? payload?.createdAt ?? new Date().toISOString()
        )
      } else {
        nextRoomMessages = upsertMessage(prevRoomMessages, incoming)
      }

      return {
        ...prev,
        messagesByRoom: {
          ...prev.messagesByRoom,
          [roomKey]: nextRoomMessages
        },
        directMessages: prev.directMessages.map((dm) => {
          if (Number(dm.id) !== Number(roomId)) {
            return dm
          }

          return isActiveRoom
            ? { ...dm, unreadCount: 0 }
            : dm
        })
      }
    })
  } catch (error) {
    console.error('Failed to parse DM room message', {
      roomId,
      body: frame?.body,
      error
    })
  }
}, [])

  const ensureDmRoomTopicSubscription = useCallback(
    (roomId) => {
      const normalizedRoomId = Number(roomId)

      if (dmRoomTopicSubscriptionsRef.current.has(normalizedRoomId)) {
        return
      }

      const client = clientRef.current
      if (!client?.connected) {
        return
      }

      console.log('[DM room topic subscribed request successs]', { roomId: normalizedRoomId })

      try {
        const subscription = client.subscribe(
          `/topic/dm/rooms/${normalizedRoomId}`,
          (frame) => handleDmRoomFrame(normalizedRoomId, frame),
          { id: `dm-room-${normalizedRoomId}` }
        )
        dmRoomTopicSubscriptionsRef.current.set(normalizedRoomId, subscription)
        console.log('[DM room topic subscribed]', { roomId: normalizedRoomId })
      } catch (error) {
        console.error('DM room topic subscribe failed', { roomId: normalizedRoomId, error })
      }
    },
    [clientRef, handleDmRoomFrame]
  )

  useEffect(() => {
    if (!isConnected) {
      dmRoomTopicSubscriptionsRef.current.forEach((subscription) => subscription?.unsubscribe())
      dmRoomTopicSubscriptionsRef.current.clear()
      activeDmRoomIdsKeyRef.current = ''
      return
    }

    const selectedDmRoomId =
      selectedRoom?.type === 'dm' ? Number(selectedRoom?.id) : Number.NaN
    const activeRoomIds = new Set(
      Number.isInteger(selectedDmRoomId) && selectedDmRoomId > 0 ? [selectedDmRoomId] : []
    )
    const activeRoomIdsKey = Array.from(activeRoomIds).join(',')
    const hasSameActiveRoomIds = activeDmRoomIdsKeyRef.current === activeRoomIdsKey
    activeDmRoomIdsKeyRef.current = activeRoomIdsKey

    if (hasSameActiveRoomIds) {
      return
    }

    activeRoomIds.forEach((roomId) => {
      ensureDmRoomTopicSubscription(roomId)
    })

    dmRoomTopicSubscriptionsRef.current.forEach((subscription, roomId) => {
      if (activeRoomIds.has(Number(roomId))) {
        return
      }

      subscription?.unsubscribe()
      dmRoomTopicSubscriptionsRef.current.delete(roomId)
    })
  }, [ensureDmRoomTopicSubscription, isConnected, selectedRoom?.id, selectedRoom?.type])

  const channelTopicSubscriptionsRef = useRef(new Map())
  const channelMemberEventSubScriptionsRef = useRef(new Map())
  const channelMessageModifySubscriptionsRef = useRef(new Map())
  const loadChannelMembersRef = useRef(loadChannelMembers)
  useEffect(() => {
    loadChannelMembersRef.current = loadChannelMembers
  }, [loadChannelMembers])
  const myProfileRef = useRef(layoutData.myProfile)
  useEffect(() => {
    myProfileRef.current = layoutData.myProfile
  }, [layoutData.myProfile])

  const ensureChannelTopicSubscription = useCallback((channelId) => {
    const id = Number(channelId)
    if (channelTopicSubscriptionsRef.current.has(id)) return

    const client = clientRef.current
    if (!client?.connected) return

    try {
      const subscription = client.subscribe(
        `/topic/channel/${id}`,
        (frame) => {
          try {
            const payload = JSON.parse(frame.body)
            const incoming = {
              id: payload.channelMessageId,
              channelMessageId: payload.channelMessageId,
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
            const roomKey = `channel:${id}`
            setLayoutData((prev) => ({
              ...prev,
              messagesByRoom: {
                ...prev.messagesByRoom,
                [roomKey]: [...(prev.messagesByRoom[roomKey] ?? []), incoming]
              }
            }))
          } catch (error) {
            console.error('채널 STOMP 메시지 파싱 실패', { channelId: id, error })
          }
        },
        { id: `channel-${id}` }
      )
      channelTopicSubscriptionsRef.current.set(id, subscription)
      console.log('[Channel topic subscribed]', { channelId: id })
    } catch (error) {
      console.error('채널 토픽 구독 실패', { channelId: id, error })
    }
  }, [clientRef])

  const ensureChannelMemberEventSubscription = useCallback((channelId) => {
    const id = Number(channelId);
    if (channelMemberEventSubScriptionsRef.current.has(id)) return
    
    const client = clientRef.current
    if (!client?.connected) return

    try {
      const subscription = client.subscribe(
        `/topic/channel/${id}/members`,
        (frame) => {
          const event = JSON.parse(frame.body)
          const isMySelf = Number(event.userId) === Number(myProfileRef.current.id)

          if (event.eventType === 'MEMBER_LEFT' && isMySelf) {
            setLayoutData((prev) => ({
              ...prev,
              rightPanelData: { ...prev.rightPanelData, member: []}
            }))
          } else {
            loadChannelMembersRef.current(id).catch((error) => {
              console.error('채널 멤버 갱신 실패', { channelId: id, error })
            })
          }

        },
        { id: `channel-members-${id}` }
      )
      channelMemberEventSubScriptionsRef.current.set(id, subscription)
      console.log('[Channel member event subscribed]', { channelId: id })
    } catch (error) {
      console.error('채널 멤버 이벤트 구독 실패', { channelId: id, error })
    }
  }, [clientRef])

  const ensureChannelMessageModifySubscription = useCallback((channelId) => {
    const id = Number(channelId)
    if (channelMessageModifySubscriptionsRef.current.has(id)) return

    const client = clientRef.current
    if (!client?.connected) return

    try {
      const subscription = client.subscribe(
        `/topic/channel/${id}/messages`,
        (frame) => {
          try {
            const payload = JSON.parse(frame.body)
            const roomKey = `channel:${id}`
            setLayoutData((prev) => ({
              ...prev,
              messagesByRoom: {
                ...prev.messagesByRoom,
                [roomKey]: (prev.messagesByRoom[roomKey] ?? []).map((msg) =>
                  msg.channelMessageId === payload.channelMessageId
                    ? { ...msg, text: payload.content, status: String(payload.status ?? '').toLowerCase() }
                    : msg
                )
              }
            }))
          } catch (error) {
            console.error('채널 메시지 수정 이벤트 파싱 실패', { channelId: id, error })
          }
        },
        { id: `channel-msg-modify-${id}` }
      )
      channelMessageModifySubscriptionsRef.current.set(id, subscription)
      console.log('[Channel message modify subscribed]', { channelId: id })
    } catch (error) {
      console.error('채널 메시지 수정 구독 실패', { channelId: id, error })
    }
  }, [clientRef])

  useEffect(() => {
    if (!isConnected) {
      channelTopicSubscriptionsRef.current.forEach((sub) => sub?.unsubscribe())
      channelTopicSubscriptionsRef.current.clear()

      channelMemberEventSubScriptionsRef.current.forEach((sub) => sub?.unsubscribe())
      channelMemberEventSubScriptionsRef.current.clear()

      channelMessageModifySubscriptionsRef.current.forEach((sub) => sub?.unsubscribe())
      channelMessageModifySubscriptionsRef.current.clear()
      return
    }

    const myChannelIds = (layoutData.channels ?? [])
      .filter((ch) => ch.isMember)
      .map((ch) => Number(ch.id))

    myChannelIds.forEach((id) => {
      ensureChannelTopicSubscription(id)
      ensureChannelMemberEventSubscription(id)
      ensureChannelMessageModifySubscription(id)
    })

    channelTopicSubscriptionsRef.current.forEach((sub, id) => {
      if (!myChannelIds.includes(id)) {
        sub?.unsubscribe()
        channelTopicSubscriptionsRef.current.delete(id)
      }
    })

    channelMemberEventSubScriptionsRef.current.forEach((sub, id) => {
      if (!myChannelIds.includes(id)) {
        sub?.unsubscribe()
        channelMemberEventSubScriptionsRef.current.delete(id)
      }
    })

    channelMessageModifySubscriptionsRef.current.forEach((sub, id) => {
      if (!myChannelIds.includes(id)) {
        sub?.unsubscribe()
        channelMessageModifySubscriptionsRef.current.delete(id)
      }
    })
  }, [isConnected, layoutData.channels, ensureChannelTopicSubscription, ensureChannelMemberEventSubscription, ensureChannelMessageModifySubscription])

  useEffect(() => {
    if (!isConnected) {
      return undefined
    }

    const scheduleRefresh = (withRetry = false) => {
      if (dmRoomRefreshTimerRef.current) {
        clearTimeout(dmRoomRefreshTimerRef.current)
      }

      dmRoomRefreshTimerRef.current = setTimeout(() => {
        loadDmRooms().catch((error) => {
          console.error('DM room list refresh failed', error)
        })
      }, 120)

      if (withRetry) {
        setTimeout(() => {
          loadDmRooms().catch((error) => {
            console.error('DM room list delayed refresh failed', error)
          })
        }, 900)
      }
    }

    const client = clientRef.current
    if (!client?.connected) {
      console.warn('[DM inbox subscribe skipped] client is not connected yet')
      return undefined
    }

    const inboxDestinations = ['/user/queue/dm/events', '/queue/dm/events']
    console.log('[DM inbox subscribe attempt]', {
      destinations: inboxDestinations,
      connected: client.connected
    })

    const handleInboxFrame = (frame, destination) => {
      try {
        const event = JSON.parse(frame.body)
        const dmRoomId = Number(event?.dmRoomId)
        const eventType = String(event?.eventType ?? '')
        const isDmMessageCreatedEvent = eventType === 'DM_MESSAGE_CREATED'
        const hasRoomSubscription =
          dmRoomId > 0 && dmRoomTopicSubscriptionsRef.current.has(Number(dmRoomId))
        const unreadTriggerEvent = isUnreadTriggerDmEvent(event)
        const messageDedupKey =
          Number(event?.dmMessageId ?? 0) > 0
            ? `msg:${dmRoomId}:${Number(event.dmMessageId)}`
            : `evt:${eventType}:${dmRoomId}`
        console.log('[DM inbox received]', {
          destination,
          eventType,
          dmRoomId: event?.dmRoomId,
          dmMessageId: event?.dmMessageId,
          authorId: event?.authorId
        })

        ensureDmRoomTopicSubscription(dmRoomId)

        if (isDmMessageCreatedEvent && !hasRoomSubscription) {
          loadDmRooms().catch((error) => {
            console.error('DM room list refresh on missed subscription failed', error)
          })
        }

        if (unreadTriggerEvent) {
          if (!dmInboxEventDedupRef.current.has(messageDedupKey)) {
            dmInboxEventDedupRef.current.add(messageDedupKey)
            if (dmInboxEventDedupRef.current.size > 2000) {
              dmInboxEventDedupRef.current.clear()
            }

            setLayoutData((prev) => {
              const selectedDmId =
                selectedRoomRef.current?.type === 'dm' ? Number(selectedRoomRef.current.id) : 0
              const isActiveRoom = selectedDmId > 0 && selectedDmId === Number(dmRoomId)
              const existingIndex = prev.directMessages.findIndex(
                (dm) => Number(dm.id) === Number(dmRoomId)
              )

              if (existingIndex >= 0) {
                const nextDirectMessages = [...prev.directMessages]
                const target = nextDirectMessages[existingIndex]
                nextDirectMessages[existingIndex] = {
                  ...target,
                  unreadCount: isActiveRoom ? 0 : Number(target.unreadCount ?? 0) + 1
                }

                return {
                  ...prev,
                  directMessages: nextDirectMessages
                }
              }

              const fallbackName = `DM ${dmRoomId}`
              const fallbackDm = {
                id: dmRoomId,
                name: fallbackName,
                initials: toInitials(fallbackName),
                colorKey: pickColorKey(dmRoomId),
                isOnline: false,
                unreadCount: isActiveRoom ? 0 : 1
              }

              return {
                ...prev,
                directMessages: [fallbackDm, ...prev.directMessages],
                roomMetaByRoomKey: {
                  ...prev.roomMetaByRoomKey,
                  [`dm:${dmRoomId}`]: {
                    title: fallbackName,
                    description: 'Direct Message'
                  }
                }
              }
            })
          }
        }

        // Refresh DM list for any valid DM event so backend event type changes do not break UI updates.
        scheduleRefresh(true)
      } catch (error) {
        console.error('Failed to parse DM inbox event', {
          destination,
          body: frame?.body,
          error
        })
      }
    }

    const subscriptions = inboxDestinations
      .map((destination, index) => {
        try {
          const id = `dm-inbox-${index}-${Date.now()}`
          return client.subscribe(
            destination,
            (frame) => {
              try {
                const payload = JSON.parse(frame?.body ?? '{}')
                const dmRoomId = Number(payload?.dmRoomId)
                if (Number.isInteger(dmRoomId)) {
                  ensureDmRoomTopicSubscription(dmRoomId)
                }
              } catch (preEnsureError) {
                console.warn('DM inbox pre-ensure parse failed', {
                  destination,
                  body: frame?.body,
                  error: preEnsureError
                })
              }

              handleInboxFrame(frame, destination)
            },
            { id }
          )
        } catch (error) {
          console.error('DM inbox subscribe failed', { destination, error })
          return null
        }
      })
      .filter(Boolean)

    let channelInboxSubscription = null
    try {
      channelInboxSubscription = client.subscribe(
        // `/user/${myProfileRef.current.id}/queue/channel/events`,
        '/user/queue/channel/events', 
        // `/queue/channel/events`,
        (frame) => {
          console.log('[Channel inbox received]', frame?.body)
          try {
            const event = JSON.parse(frame.body)
            console.log('[Channel inbox event]', event)
            if (event.eventType === 'MEMBER_INVITED') {
              console.log('[Channel inbox] MEMBER_INVITED → loadChannels 호출')
              loadChannels().then(() => {
                console.log('[Channel inbox] loadChannels 완료')
              }).catch((error) => {
                console.error('채널 목록 갱신 실패', error)
              })
            }
          } catch (error) {
            console.error('채널 인박스 이벤트 파싱 실패', { body: frame?.body, error })
          }
        },
        { id: 'channel-inbox' }
      )
      console.log('[Channel inbox subscribed]')
    } catch (error) {
      console.error('채널 인박스 구독 실패', error)
    }

    return () => {
      if (dmRoomRefreshTimerRef.current) {
        clearTimeout(dmRoomRefreshTimerRef.current)
        dmRoomRefreshTimerRef.current = null
      }
      dmInboxEventDedupRef.current.clear()
      dmRoomNoticeDedupRef.current.clear()
      subscriptions.forEach((subscription) => subscription?.unsubscribe())
      channelInboxSubscription?.unsubscribe()
    }
  }, [clientRef, ensureDmRoomTopicSubscription, isConnected, loadChannels, loadDmRooms])

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

  const createChannelRoom = useCallback(
    async ({ channelName, description = '' }) => {
      if (!channelName?.trim()) return null
      const response = await createChannel({
        workspaceId: WORKSPACE_ID,
        channelName: channelName.trim(),
        description,
        accessToken
      })
      // loadChannels()로 roomMetaByRoomKey를 먼저 채운 뒤 selectedRoom을 설정해야
      // 헤더가 채널명을 즉시 렌더링한다. 순서가 바뀌면 title이 빈 문자열로 깜빡인다.
      await loadChannels()
      if (response?.channelId) {
        setSelectedRoom({ type: 'channel', id: response.channelId })
      }
      return response
    },
    [accessToken, loadChannels]
  )

  const deleteChannelRoom = useCallback(
    async (channelId) => {
      await deleteChannel({ channelId, accessToken })
      // 삭제된 채널이 선택된 상태로 loadChannels()가 실행되면
      // 존재하지 않는 roomKey를 참조하게 되므로 먼저 해제한다.
      setSelectedRoom(null)
      await loadChannels()
    },
    [accessToken, loadChannels]
  )

  const inviteToChannelRoom = useCallback(
    async (channelId, targetUserId) => {
      await inviteToChannel({ channelId, targetUserId, accessToken })
      //초대 후 목록을 새로고침해 memberCont등을 갱신한다.
      await loadChannels()
    },
    [accessToken, loadChannels]
  )

  const actions = {
    selectChannel: (channelId) => setSelectedRoom({ type: 'channel', id: channelId }),
    selectDirectMessage: (dm) => setSelectedRoom({ type: 'dm', id: dm.id ?? dm, dmRoomType: dm.dmRoomType }),
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
      if (!draftMessage.trim() || !selectedRoom?.id || !user?.userId) {
        return
      }

      const content = draftMessage
      const client = clientRef.current

      // 채널 메시지 전송
      if (selectedRoom.type === 'channel') {
        setDraftMessage('')
        if (!client?.connected) return
        client.publish({
          destination: STOMP_CHANNEL_SEND_DESTINATION,
          body: JSON.stringify({
            channelId: selectedRoom.id,
            threadRootMessageId: null,
            content
          })
        })
        return
      }

      // DM 메시지 전송
      if (selectedRoom.type !== 'dm') return

      const tempMessageId = `temp:${crypto.randomUUID()}`
      const roomKey = `dm:${selectedRoom.id}`

      setDraftMessage('')

      if (!client?.connected) {
        const optimisticMessage = {
          id: tempMessageId,
          dmMessageId: null,
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
        return
      }

      client.publish({
        destination: STOMP_SEND_DESTINATION,
        body: JSON.stringify({
          dmRoomId: selectedRoom.id,
          threadRootMessageId: 0,
          content
        })
      })
    },
    editChannelMessage: async (message, content) => {
      if (selectedRoom?.type !== 'channel' || !message?.channelMessageId) return
      const trimmed = String(content ?? '').trim()
      if (!trimmed) return
      await editChannelMessage({ channelMessageId: message.channelMessageId, content: trimmed, accessToken })
      const roomKey = `channel:${selectedRoom.id}`
      setLayoutData((prev) => ({
        ...prev,
        messagesByRoom: {
          ...prev.messagesByRoom,
          [roomKey]: (prev.messagesByRoom[roomKey] ?? []).map((msg) =>
            msg.channelMessageId === message.channelMessageId
              ? { ...msg, text: trimmed, status: 'modified' }
              : msg
          )
        }
      }))
    },
    deleteChannelMessage: async (message) => {
      if (selectedRoom?.type !== 'channel' || !message?.channelMessageId) return
      await deleteChannelMessage({ channelMessageId: message.channelMessageId, accessToken })
      const roomKey = `channel:${selectedRoom.id}`
      setLayoutData((prev) => ({
        ...prev,
        messagesByRoom: {
          ...prev.messagesByRoom,
          [roomKey]: (prev.messagesByRoom[roomKey] ?? []).map((msg) =>
            msg.channelMessageId === message.channelMessageId
              ? { ...msg, text: '삭제된 메시지입니다.', status: 'deleted' }
              : msg
          )
        }
      }))
    },
    editDmMessage: async (message, content) => {
      if (selectedRoom?.type !== 'dm' || !message?.dmMessageId) return
      const trimmed = String(content ?? '').trim()
      if (!trimmed) return
      await updateDmMessage({ dmRoomId: selectedRoom.id, dmMessageId: message.dmMessageId, content: trimmed, accessToken })
      const roomKey = `dm:${selectedRoom.id}`
      const nowIso = new Date().toISOString()
      setLayoutData((prev) => ({
        ...prev,
        messagesByRoom: {
          ...prev.messagesByRoom,
          [roomKey]: updateMessageContent(prev.messagesByRoom[roomKey] ?? [], message.dmMessageId, trimmed, nowIso)
        }
      }))
      const client = clientRef.current
      if (client?.connected) {
        client.publish({
          destination: STOMP_UPDATE_DESTINATION,
          body: JSON.stringify({ dmRoomId: selectedRoom.id, dmMessageId: message.dmMessageId, content: trimmed, eventType: 'MESSAGE_UPDATED', updatedAt: nowIso })
        })
      }
    },
    deleteDmMessage: async (message) => {
      if (selectedRoom?.type !== 'dm' || !message?.dmMessageId) return
      await deleteDmMessage({ dmRoomId: selectedRoom.id, dmMessageId: message.dmMessageId, accessToken })
      const roomKey = `dm:${selectedRoom.id}`
      setLayoutData((prev) => ({
        ...prev,
        messagesByRoom: {
          ...prev.messagesByRoom,
          [roomKey]: removeMessage(prev.messagesByRoom[roomKey] ?? [], message.dmMessageId)
        }
      }))
      const client = clientRef.current
      if (client?.connected) {
        client.publish({
          destination: STOMP_DELETE_DESTINATION,
          body: JSON.stringify({ dmRoomId: selectedRoom.id, dmMessageId: message.dmMessageId, eventType: 'MESSAGE_DELETED' })
        })
      }
    },
    addChannel: () => undefined,
    createChannel: createChannelRoom,
    deleteChannel: deleteChannelRoom,
    inviteToChannel: inviteToChannelRoom,
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
    },
    leaveChannel: async (channelId) => {
      await leaveChannel({ channelId, accessToken })
      setSelectedRoom((prev) =>
        prev?.type === 'channel' && prev?.id === channelId ? null : prev
      )
      await loadChannels()
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
