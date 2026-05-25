import { useNavigate, Link } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { signOut, useSession } from '../lib/auth-client'
import { Button } from '@/components/ui/button'
import { useTheme } from './ThemeProvider'

interface NavbarProps {
  userName: string
}

export default function Navbar({ userName }: NavbarProps) {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <nav className="bg-card border-b border-border px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/" className="font-semibold text-foreground text-lg hover:opacity-80 transition-opacity">Daily Task App</Link>
        {isAdmin && (
          <Link to="/users" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Users
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          Hello, <strong className="text-foreground">{userName}</strong>
        </span>
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </nav>
  )
}
