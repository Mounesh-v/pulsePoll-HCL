import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <Outlet />
      </main>
    </div>
  )
}
