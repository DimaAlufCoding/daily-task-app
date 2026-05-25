import { useState } from 'react'
import Layout from '../components/Layout'
import { useSession } from '../lib/auth-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Role = 'ADMIN' | 'CLIENT'

interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
}

function useUsers() {
  const [users, setUsers] = useState<User[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)

  async function fetchUsers() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/users', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch users')
      setUsers(await res.json())
      setFetched(true)
    } catch {
      setError('Could not load users.')
    } finally {
      setLoading(false)
    }
  }

  if (!fetched && !loading) fetchUsers()

  async function updateRole(userId: string, role: Role) {
    const res = await fetch(`/api/users/${userId}/role`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? 'Failed to update role')
    }
    const updated: User = await res.json()
    setUsers(prev => prev?.map(u => (u.id === updated.id ? updated : u)) ?? null)
  }

  return { users, loading, error, updateRole }
}

export default function UserPage() {
  const { data: session } = useSession()
  const currentUserId = session?.user?.id
  const { users, loading, error, updateRole } = useUsers()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleRoleToggle(user: User) {
    const newRole: Role = user.role === 'ADMIN' ? 'CLIENT' : 'ADMIN'
    setPendingId(user.id)
    setActionError(null)
    try {
      await updateRole(user.id, newRole)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage user roles across the platform.
          </p>
        </div>

        {actionError && (
          <p className="text-sm text-destructive">{actionError}</p>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading users…
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {users && (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.id === currentUserId ? (
                        <span className="text-xs text-muted-foreground">You</span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pendingId === user.id}
                          onClick={() => handleRoleToggle(user)}
                        >
                          {pendingId === user.id
                            ? 'Saving…'
                            : user.role === 'ADMIN'
                            ? 'Demote to Client'
                            : 'Promote to Admin'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Layout>
  )
}
