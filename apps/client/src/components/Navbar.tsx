import { useNavigate } from 'react-router-dom'
import { signOut } from '../lib/auth-client'

interface NavbarProps {
  userName: string
}

export default function Navbar({ userName }: NavbarProps) {
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <span className="font-semibold text-gray-800 text-lg">Daily Task App</span>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Hello, <strong className="text-gray-900">{userName}</strong>
        </span>
        <button
          onClick={handleSignOut}
          className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
