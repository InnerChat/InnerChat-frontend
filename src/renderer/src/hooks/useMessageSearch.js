import { useState, useCallback } from 'react'
import { useAuthStore } from '@stores/authStore'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

/**
 * GET /api/v1/search/messages?channelId=&q=
 * 응답: { keyword, totalCount, results: MessageResponse[] }
 */
export function useMessageSearch() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [results, setResults] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (channelId, keyword) => {
    if (!keyword.trim()) {
      setResults([])
      setTotalCount(0)
      return
    }

    setLoading(true)
    try {
      const { data } = await axios.get(`${BASE_URL}/api/v1/search/messages`, {
        params: { channelId, q: keyword },
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      setResults(data.results ?? [])
      setTotalCount(data.totalCount ?? 0)
    } catch (e) {
      console.error('search failed', e)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  const clear = useCallback(() => {
    setResults([])
    setTotalCount(0)
  }, [])

  return { results, totalCount, loading, search, clear }
}
