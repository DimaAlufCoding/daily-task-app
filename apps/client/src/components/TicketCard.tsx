import { Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Ticket } from '@/types/ticket'

const categoryLabel: Record<Ticket['category'], string> = {
  HEALTH: 'Health',
  WORK: 'Work',
  SHOPPING: 'Shopping',
  PERSONAL: 'Personal',
}

const categoryClass: Record<Ticket['category'], string> = {
  HEALTH: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  WORK: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  SHOPPING: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  PERSONAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
}

const priorityLabel: Record<Ticket['priority'], string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

const priorityVariant: Record<Ticket['priority'], 'outline' | 'secondary' | 'destructive'> = {
  LOW: 'outline',
  MEDIUM: 'secondary',
  HIGH: 'destructive',
}

interface TicketCardProps {
  ticket: Ticket
  onEdit: (ticket: Ticket) => void
  onDelete: (ticket: Ticket) => void
}

export default function TicketCard({ ticket, onEdit, onDelete }: TicketCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-medium leading-snug">{ticket.title}</CardTitle>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Edit ticket" onClick={() => onEdit(ticket)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              aria-label="Delete ticket"
              onClick={() => onDelete(ticket)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {ticket.description && (
        <CardContent className="pb-2">
          <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
        </CardContent>
      )}

      <CardFooter className="mt-auto flex gap-2 pt-3">
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', categoryClass[ticket.category])}>
          {categoryLabel[ticket.category]}
        </span>
        <Badge variant={priorityVariant[ticket.priority]}>{priorityLabel[ticket.priority]}</Badge>
      </CardFooter>
    </Card>
  )
}
