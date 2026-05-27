export interface Ticket {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'MOVED_TO_NEXT_DAY'
  category: 'HEALTH' | 'WORK' | 'SHOPPING' | 'PERSONAL'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  createdAt: string
}
