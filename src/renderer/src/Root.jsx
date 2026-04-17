import AuthProvider from '@/components/layout/AuthProvider'
import { Outlet } from 'react-router-dom'
import useStompClient from '@/hooks/useStompClient'

export default function Root() {
    useStompClient() //accessToken 생기는 순간 자동 연결

    return (
        <AuthProvider>
            <Outlet/>
        </AuthProvider>
    )
}