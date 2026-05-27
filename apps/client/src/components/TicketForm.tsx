import axios from 'axios'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Ticket } from '@/types/ticket'

const ticketSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['HEALTH', 'WORK', 'SHOPPING', 'PERSONAL']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
})
type TicketValues = z.infer<typeof ticketSchema>

interface TicketFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket?: Ticket
  queryClient: QueryClient
}

export default function TicketForm({ open, onOpenChange, ticket, queryClient }: TicketFormProps) {
  const isEdit = !!ticket

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<TicketValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'PERSONAL',
      priority: 'MEDIUM',
    },
  })

  useEffect(() => {
    if (open) {
      reset(
        ticket
          ? { title: ticket.title, description: ticket.description ?? '', category: ticket.category, priority: ticket.priority }
          : { title: '', description: '', category: 'PERSONAL', priority: 'MEDIUM' }
      )
    }
  }, [open, ticket, reset])

  async function onSubmit(values: TicketValues) {
    try {
      if (isEdit && ticket) {
        const { data } = await axios.patch<Ticket>(`/api/tickets/${ticket.id}`, values, { withCredentials: true })
        queryClient.setQueryData<Ticket[]>(['tickets'], prev =>
          prev?.map(t => (t.id === data.id ? data : t)) ?? []
        )
      } else {
        const { data } = await axios.post<Ticket>('/api/tickets', values, { withCredentials: true })
        queryClient.setQueryData<Ticket[]>(['tickets'], prev => [data, ...(prev ?? [])])
      }
      onOpenChange(false)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = (err.response?.data as { error?: string })?.error ?? 'Something went wrong'
        setError('root', { message })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Ticket' : 'Create Ticket'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the ticket details.' : 'Add a new ticket to your board.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="ticket-title">Title</Label>
            <Input
              id="ticket-title"
              type="text"
              aria-invalid={!!errors.title}
              {...register('title')}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ticket-description">Description (optional)</Label>
            <Textarea
              id="ticket-description"
              rows={3}
              className="resize-none"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" aria-invalid={!!errors.category}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HEALTH">Health</SelectItem>
                      <SelectItem value="WORK">Work</SelectItem>
                      <SelectItem value="SHOPPING">Shopping</SelectItem>
                      <SelectItem value="PERSONAL">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" aria-invalid={!!errors.priority}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.priority && <p className="text-xs text-destructive">{errors.priority.message}</p>}
            </div>
          </div>

          {errors.root && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {errors.root.message}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Create Ticket')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
