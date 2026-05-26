import { useState } from 'react'
import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil } from 'lucide-react'
import Layout from '../components/Layout'
import { useSession } from '../lib/auth-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

const createUserSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type CreateUserValues = z.infer<typeof createUserSchema>

async function createUser(values: CreateUserValues): Promise<User> {
  const { data } = await axios.post<User>('/api/users', values, { withCredentials: true })
  return data
}

const editUserSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').or(z.literal('')).optional(),
})
type EditUserValues = z.infer<typeof editUserSchema>

async function updateUser(userId: string, values: EditUserValues): Promise<User> {
  const body = { name: values.name, email: values.email, ...(values.password ? { password: values.password } : {}) }
  const { data } = await axios.patch<User>(`/api/users/${userId}`, body, { withCredentials: true })
  return data
}

export default function UserPage() {
  const { data: session } = useSession()
  const currentUserId = session?.user?.id
  const queryClient = useQueryClient()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

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

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (newUser) => {
      queryClient.setQueryData<User[]>(['users'], prev => [...(prev ?? []), newUser])
      setIsCreateOpen(false)
    },
  })

  const editMutation = useMutation({
    mutationFn: ({ userId, values }: { userId: string; values: EditUserValues }) =>
      updateUser(userId, values),
    onSuccess: (updated) => {
      queryClient.setQueryData<User[]>(['users'], prev =>
        prev?.map(u => (u.id === updated.id ? updated : u)) ?? [])
      setEditingUser(null)
    },
  })

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors, isSubmitting: isCreating },
    reset: resetCreate,
    setError: setCreateError,
  } = useForm<CreateUserValues>({ resolver: zodResolver(createUserSchema) })

  async function onCreateUser(values: CreateUserValues) {
    try {
      await createMutation.mutateAsync(values)
      resetCreate()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = (err.response?.data as { error?: string })?.error ?? 'Failed to create user'
        setCreateError('root', { message })
      }
    }
  }

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors, isSubmitting: isEditing },
    reset: resetEdit,
    setError: setEditError,
  } = useForm<EditUserValues>({ resolver: zodResolver(editUserSchema) })

  function openEdit(user: User) {
    resetEdit({ name: user.name, email: user.email, password: '' })
    setEditingUser(user)
  }

  async function onEditUser(values: EditUserValues) {
    if (!editingUser) return
    try {
      await editMutation.mutateAsync({ userId: editingUser.id, values })
      resetEdit()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = (err.response?.data as { error?: string })?.error ?? 'Failed to update user'
        setEditError('root', { message })
      }
    }
  }

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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage user roles across the platform.
            </p>
          </div>
          <Button onClick={() => { resetCreate(); setIsCreateOpen(true) }}>
            Create User
          </Button>
        </div>

        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}

        {isLoading && (
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
                {Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                      <div className="flex items-center justify-end gap-2">
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
                        <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>
              Add a new user. They will be assigned the Client role by default.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit(onCreateUser)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                type="text"
                autoComplete="name"
                aria-invalid={!!createErrors.name}
                {...registerCreate('name')}
              />
              {createErrors.name && (
                <p className="text-xs text-destructive">{createErrors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                autoComplete="off"
                aria-invalid={!!createErrors.email}
                {...registerCreate('email')}
              />
              {createErrors.email && (
                <p className="text-xs text-destructive">{createErrors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!createErrors.password}
                {...registerCreate('password')}
              />
              {createErrors.password && (
                <p className="text-xs text-destructive">{createErrors.password.message}</p>
              )}
            </div>
            {createErrors.root && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {createErrors.root.message}
              </p>
            )}
            <Button type="submit" disabled={isCreating} className="w-full">
              {isCreating ? 'Creating…' : 'Create User'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!editingUser} onOpenChange={(open) => { if (!open) setEditingUser(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update name or email. Leave the password blank to keep it unchanged.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onEditUser)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                type="text"
                autoComplete="name"
                aria-invalid={!!editErrors.name}
                {...registerEdit('name')}
              />
              {editErrors.name && (
                <p className="text-xs text-destructive">{editErrors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                autoComplete="off"
                aria-invalid={!!editErrors.email}
                {...registerEdit('email')}
              />
              {editErrors.email && (
                <p className="text-xs text-destructive">{editErrors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-password">New Password (leave blank to keep unchanged)</Label>
              <Input
                id="edit-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!editErrors.password}
                {...registerEdit('password')}
              />
              {editErrors.password && (
                <p className="text-xs text-destructive">{editErrors.password.message}</p>
              )}
            </div>
            {editErrors.root && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {editErrors.root.message}
              </p>
            )}
            <Button type="submit" disabled={isEditing} className="w-full">
              {isEditing ? 'Saving…' : 'Save Changes'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}
