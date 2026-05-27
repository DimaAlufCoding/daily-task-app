import "dotenv/config"
import express from 'express'
import cors from 'cors'
import { z } from 'zod'
import { toNodeHandler } from "better-auth/node"
import { hashPassword } from "better-auth/crypto"
import { auth } from './lib/auth'
import { prisma } from './lib/prisma'
import { requireAdmin } from './middleware/require-admin'
import { requireAuth } from './middleware/require-auth'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))

// Must be mounted before express.json() — Better Auth reads the raw body
app.all("/api/auth/*", toNodeHandler(auth))

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const createTicketSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['HEALTH', 'WORK', 'SHOPPING', 'PERSONAL']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
})

const updateTicketSchema = createTicketSchema.extend({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'MOVED_TO_NEXT_DAY']).optional(),
})

app.get('/api/tickets', requireAuth, async (_req, res) => {
  const userId = res.locals.session.user.id
  const tickets = await prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  res.json(tickets)
})

app.post('/api/tickets', requireAuth, async (req, res) => {
  const result = createTicketSchema.safeParse(req.body)
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return }
  const userId = res.locals.session.user.id
  const ticket = await prisma.task.create({ data: { ...result.data, userId } })
  res.status(201).json(ticket)
})

app.patch('/api/tickets/:id', requireAuth, async (req, res) => {
  const result = updateTicketSchema.safeParse(req.body)
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return }
  const id = req.params.id as string
  const userId = res.locals.session.user.id
  const existing = await prisma.task.findUnique({ where: { id } })
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: 'Ticket not found' }); return
  }
  const ticket = await prisma.task.update({ where: { id }, data: result.data })
  res.json(ticket)
})

app.delete('/api/tickets/:id', requireAuth, async (req, res) => {
  const id = req.params.id as string
  const userId = res.locals.session.user.id
  const existing = await prisma.task.findUnique({ where: { id } })
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: 'Ticket not found' }); return
  }
  await prisma.task.delete({ where: { id } })
  res.status(204).end()
})

app.get('/api/users', requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  res.json(users)
})

const updateRoleSchema = z.object({ role: z.enum(['ADMIN', 'CLIENT']) })

app.patch('/api/users/:id/role', requireAdmin, async (req, res) => {
  const result = updateRoleSchema.safeParse(req.body)
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return }

  const id = req.params.id as string
  const currentUserId = res.locals.session.user.id
  if (id === currentUserId) {
    res.status(400).json({ error: 'Cannot change your own role' })
    return
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: result.data.role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })
  res.json(user)
})

const updateUserSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(8).optional(),
})

app.patch('/api/users/:id', requireAdmin, async (req, res) => {
  const result = updateUserSchema.safeParse(req.body)
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return }

  const id = req.params.id as string
  const { name, email, password } = result.data

  const user = await prisma.user.update({
    where: { id },
    data: { name, email },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  if (password) {
    const account = await prisma.account.findFirst({
      where: { userId: id, providerId: 'credential' },
    })
    if (account) {
      await prisma.account.update({
        where: { id: account.id },
        data: { password: await hashPassword(password) },
      })
    }
  }

  res.json(user)
})

const createUserSchema = z.object({
  name: z.string().trim().min(1),
  email: z.email(),
  password: z.string().trim().min(8),
})

app.post('/api/users', requireAdmin, async (req, res) => {
  const result = createUserSchema.safeParse(req.body)
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return }
  const { name, email, password } = result.data

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) {
    res.status(409).json({ error: 'A user with this email already exists' })
    return
  }

  await auth.api.signUpEmail({ body: { name, email, password } })

  const user = await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { role: 'CLIENT' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  res.status(201).json(user)
})

app.delete('/api/users/:id', requireAdmin, async (req, res) => {
  const id = req.params.id as string
  const currentUserId = res.locals.session.user.id

  if (id === currentUserId) {
    res.status(400).json({ error: 'Cannot delete your own account' })
    return
  }

  const target = await prisma.user.findUnique({ where: { id } })
  if (!target || target.deletedAt) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  if ((target.role as string) === 'ADMIN') {
    res.status(400).json({ error: 'Admin users cannot be deleted' })
    return
  }

  await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } })
  res.status(204).end()
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
