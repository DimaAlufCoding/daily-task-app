import "dotenv/config"
import express from 'express'
import cors from 'cors'
import { toNodeHandler } from "better-auth/node"
import { auth } from './lib/auth'
import { prisma } from './lib/prisma'

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
