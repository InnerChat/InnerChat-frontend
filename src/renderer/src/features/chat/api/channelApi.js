import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

function buildAuthHeaders(accessToken) {
  if (!accessToken) return {}
  return { Authorization: `Bearer ${accessToken}` }
}

export async function readChannelList({ workspaceId, accessToken }) {
  const { data } = await axios.get(`${BASE_URL}/channel`, {
    params: { workspaceId },
    headers: buildAuthHeaders(accessToken)
  })
  return Array.isArray(data) ? data : []
}

export async function readChannelListUserId({ accessToken }) {
  const { data } = await axios.get(`${BASE_URL}/channel/me`, {
    params: {},
    headers: buildAuthHeaders(accessToken)
  })
  return Array.isArray(data) ? data : [];
}

export async function createChannel({ workspaceId, channelName, description, type, accessToken }) {
  const { data } = await axios.post(
    `${BASE_URL}/channel`,
    { workspaceId, channelName, description, type },
    { headers: buildAuthHeaders(accessToken) }
  )
  return data
}

export async function deleteChannel({ channelId, accessToken }) {
  await axios.delete(`${BASE_URL}/channel/${channelId}`, {
    headers: buildAuthHeaders(accessToken)
  })
}

export async function joinChannel({ channelId, accessToken }) {
  await axios.post(
    `${BASE_URL}/channel/${channelId}/join`,
    {},
    { hearders: buildAuthHeaders(accessToken) }
  )
}

export async function readChannelMessages({ channelId, cursor = null, accessToken }) {
  const { data } = await axios.get(`${BASE_URL}/channel/${channelId}/messages`, {
    params: cursor ? { cursor } : {},
    headers: buildAuthHeaders(accessToken)
  })
  return Array.isArray(data) ? data : []
}

export async function readChannelMembers({ channelId, accessToken }) {
  const { data } = await axios.get(`${BASE_URL}/channel/${channelId}/members`, {
    headers: buildAuthHeaders(accessToken)
  })
  return Array.isArray(data) ? data : []
}

export async function leaveChannel({ channelId, accessToken }) {
  await axios.delete(`${BASE_URL}/channel/${channelId}/leave`, {
    headers: buildAuthHeaders(accessToken)
  })
}

export async function inviteToChannel({ channelId, targetUserId, accessToken }) {
  await axios.post(
    `${BASE_URL}/channel/${channelId}/invite`,
    { targetUserId },
    { headers: buildAuthHeaders(accessToken) },
  )
}

export async function editChannelMessage({ channelMessageId, content, accessToken }) {
  await axios.patch(
    `${BASE_URL}/channel/message`,
    { channelMessageId, content, action: 'MODIFIED' },
    { headers: buildAuthHeaders(accessToken) }
  )
}

export async function deleteChannelMessage({ channelMessageId, accessToken }) {
  await axios.patch(
    `${BASE_URL}/channel/message`,
    { channelMessageId, action: 'DELETED' },
    { headers: buildAuthHeaders(accessToken) }
  )
}