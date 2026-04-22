import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL
const API_PREFIX = `${BASE_URL}`

function buildAuthHeaders(accessToken) {
  if (!accessToken) {
    return {}
  }

  return {
    Authorization: `Bearer ${accessToken}`
  }
}

export async function readDmRoomList({ accessToken }) {
  const { data } = await axios.get(`${API_PREFIX}/dm`, {
    headers: buildAuthHeaders(accessToken)
  })

  return data
}

export async function createDmRoom({ workspaceId, participantIdList, accessToken }) {
  const { data } = await axios.post(
    `${API_PREFIX}/dm`,
    { workspaceId, participantIdList },
    { headers: buildAuthHeaders(accessToken) }
  )

  return data
}

export async function updateLastReadDmMessage({ dmRoomId, accessToken }) {
  await axios.put(
    `${API_PREFIX}/dm/read`,
    { dmRoomId },
    { headers: buildAuthHeaders(accessToken) }
  )
}

export async function createDmRoomParticipants({ dmRoomId, userIdList, accessToken }) {
  await axios.post(
    `${API_PREFIX}/dm/participants`,
    { dmRoomId, userIdList },
    { headers: buildAuthHeaders(accessToken) }
  )
}

export async function removeDmRoomParticipant({ dmRoomId, accessToken }) {
  await axios.delete(`${API_PREFIX}/dm/participants`, {
    data: { dmRoomId },
    headers: buildAuthHeaders(accessToken)
  })
}

export async function readDmMessages({ dmRoomId, cursor, accessToken }) {
  const params = {}
  if (typeof cursor === 'number') {
    params.cursor = cursor
  }

  const { data } = await axios.get(`${API_PREFIX}/dm/chat/${dmRoomId}/messages`, {
    params,
    headers: buildAuthHeaders(accessToken)
  })

  return data
}

export async function createDmMessageByHttp({
  workspaceId,
  dmRoomId,
  threadRootMessageId,
  content,
  accessToken
}) {
  await axios.post(
    `${API_PREFIX}/dm/chat`,
    { workspaceId, dmRoomId, threadRootMessageId, content },
    { headers: buildAuthHeaders(accessToken) }
  )
}

export async function readWorkspaceMembersForDm({ workspaceId, accessToken }) {
  const { data } = await axios.get(`${API_PREFIX}/user/${workspaceId}`, {
    headers: buildAuthHeaders(accessToken)
  })
  return data
}
