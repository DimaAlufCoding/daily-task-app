import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

async function fetchUsers(): Promise<User[]> {
  const { data } = await axios.get<User[]>('/api/users', { withCredentials: true })
  return data
}

async function updateRole(userId: string, role: Role): Promise<User> {
  const { data } = await axios.patch<User>(`/api/users/${userId}/role`, { role }, { withCredentials: true })
  return data
}

export default function UserPage() {
  const { data: session } = useSession()
  const currentUserId = session?.user?.id
  const queryClient = useQueryClient()

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  const mutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) => updateRole(userId, role),
    onSuccess: (updated) => {
      queryClient.setQueryData<User[]>(['users'], prev =>
        prev?.map(u => (u.id === updated.id ? updated : u)) ?? []
      )
    },
  })

  const errorMessage = error
    ? 'Could not load users.'
    : mutation.error
    ? axios.isAxiosError(mutation.error)
      ? (mutation.error.response?.data as { error?: string })?.error ?? 'Failed to update role'
      : 'Failed to update role'
    : null

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage user roles across the platform.
          </p>
        </div>

        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading users…
          </div>
        )}

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
                          disabled={mutation.isPending && mutation.variables?.userId === user.id}
                          onClick={() =>
                            mutation.mutate({
                              userId: user.id,
                              role: user.role === 'ADMIN' ? 'CLIENT' : 'ADMIN',
                            })
                          }
                        >
                          {mutation.isPending && mutation.variables?.userId === user.id
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
