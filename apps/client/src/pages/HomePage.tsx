import { useSession } from '../lib/auth-client'
import Navbar from '../components/Navbar'

export default function HomePage() {
  const { data: session } = useSession()
  const userName = session?.user?.name ?? session?.user?.email ?? 'User'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={userName} />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900">Your Tasks</h1>
        <p className="mt-2 text-gray-500">Your Kanban board will appear here.</p>
      </main>
    </div>
  )
}
