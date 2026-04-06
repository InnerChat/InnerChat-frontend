import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'

const PUBLIC_PATHS = ['/', '/oauth/callback']

export default function AuthProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isAdmin, accessToken } = useAuthStore()

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.includes(location.pathname)

    if (!isAuthenticated() && !isPublic) {
      navigate('/', { replace: true })
      return
    }

    if (isAuthenticated() && location.pathname === '/') {
      navigate(isAdmin() ? '/admin' : '/app', { replace: true })
      return
    }

    if (location.pathname === '/admin' && isAuthenticated() && !isAdmin()) {
      navigate('/app', { replace: true })
    }
  }, [location.pathname])

  useEffect(() => {
    if (accessToken) {
      useAuthStore.getState()._scheduleRefresh()
    }
  }, [])

  return children
}
