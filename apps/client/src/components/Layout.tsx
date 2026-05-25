import { useSession } from '../lib/auth-client'
import Navbar from './Navbar'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { data: session } = useSession()
  const userName = session?.user?.name ?? session?.user?.email ?? 'User'

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar userName={userName} />
      <main className="max-w-4xl mx-auto px-6 py-10">{children}</main>
    </div>
  )
}
