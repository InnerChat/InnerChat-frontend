import AuthProvider from '@/components/layout/AuthProvider'
import { Outlet } from 'react-router-dom'

export default function Root() {
    return (
        <AuthProvider>
            <Outlet/>
        </AuthProvider>
    )
}