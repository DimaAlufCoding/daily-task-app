import { useState } from 'react'
import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import TicketCard from '../components/TicketCard'
import TicketForm from '../components/TicketForm'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Ticket } from '@/types/ticket'

async function fetchTickets(): Promise<Ticket[]> {
  const { data } = await axios.get<Ticket[]>('/api/tickets', { withCredentials: true })
  return data
}

export default function HomePage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<Ticket | undefined>(undefined)
  const [deletingTicket, setDeletingTicket] = useState<Ticket | null>(null)

  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ['tickets'],
    queryFn: fetchTickets,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/tickets/${id}`, { withCredentials: true }),
    onSuccess: () => {
      queryClient.setQueryData<Ticket[]>(['tickets'], prev =>
        prev?.filter(t => t.id !== deletingTicket?.id) ?? []
      )
      setDeletingTicket(null)
    },
  })

  function openCreate() {
    setEditingTicket(undefined)
    setFormOpen(true)
  }

  function openEdit(ticket: Ticket) {
    setEditingTicket(ticket)
    setFormOpen(true)
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your Tasks</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your daily tickets.</p>
          </div>
          <Button onClick={openCreate}>Create Ticket</Button>
        </div>

        {error && (
          <p className="text-sm text-destructive">Could not load tickets.</p>
        )}

        {isLoading && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {tickets && tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
            <p className="text-muted-foreground text-sm">No tickets yet.</p>
            <Button variant="link" className="mt-2 text-sm" onClick={openCreate}>
              Create your first ticket
            </Button>
          </div>
        )}

        {tickets && tickets.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tickets.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onEdit={openEdit}
                onDelete={setDeletingTicket}
              />
            ))}
          </div>
        )}
      </div>

      <TicketForm
        open={formOpen}
        onOpenChange={setFormOpen}
        ticket={editingTicket}
        queryClient={queryClient}
      />

      <AlertDialog open={!!deletingTicket} onOpenChange={open => { if (!open) setDeletingTicket(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingTicket?.title}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => deletingTicket && deleteMutation.mutate(deletingTicket.id)}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  )
}
