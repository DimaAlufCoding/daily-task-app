import "dotenv/config"
import express from 'express'
import cors from 'cors'
import { toNodeHandler } from "better-auth/node"
import { auth } from './lib/auth'
import { prisma } from './lib/prisma'
import { requireAdmin } from './middleware/require-admin'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))

// Must be mounted before express.json() — Better Auth reads the raw body
app.all("/api/auth/*", toNodeHandler(auth))

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/tasks', async (_req, res) => {
  const tasks = await prisma.task.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(tasks)
})

app.post('/api/tasks', async (req, res) => {
  const { title } = req.body as { title: string }
  const task = await prisma.task.create({ data: { title } })
  res.status(201).json(task)
})

app.get('/api/users', requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  res.json(users)
})

app.patch('/api/users/:id/role', requireAdmin, async (req, res) => {
  const id = req.params.id as string
  const { role } = req.body as { role: string }

  if (role !== 'ADMIN' && role !== 'CLIENT') {
    res.status(400).json({ error: 'Invalid role' })
    return
  }

  const currentUserId = res.locals.session.user.id
  if (id === currentUserId) {
    res.status(400).json({ error: 'Cannot change your own role' })
    return
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: role as 'ADMIN' | 'CLIENT' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })
  res.json(user)
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
