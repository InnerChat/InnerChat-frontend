import { createHashRouter } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import OAuthCallbackPage from '@/pages/OAuthCallbackPage'
import MainLayout from '@/components/layout/MainLayout'
import AdminPage from '@/pages/AdminPage'
import AuthProvider from '@/components/layout/AuthProvider'
import { Outlet } from 'react-router-dom'

function Root() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}

// Electron에서는 createHashRouter 사용 (file:// 프로토콜 대응)
export const router = createHashRouter([
  {
    element: <Root />,
    children: [
      { path: '/', element: <LoginPage /> },
      { path: '/oauth/callback', element: <OAuthCallbackPage /> },
      { path: '/app', element: <MainLayout /> },
      { path: '/admin', element: <AdminPage /> }
    ]
  }
])
