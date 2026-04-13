import { createHashRouter } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import MainLayout from '@/components/layout/MainLayout'
import Root from './Root'

// Electron에서는 createHashRouter 사용 (file:// 프로토콜 대응)
export const router = createHashRouter([
  {
    element: <Root />,
    children: [
      { path: '/', element: <LoginPage /> },
      { path: '/app', element: <MainLayout /> }
    ]
  }
])
