import type { RequestHandler } from "express"
import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../lib/auth"

export type AuthSession = typeof auth.$Infer.Session

declare global {
  namespace Express {
    interface Locals {
      session: AuthSession
    }
  }
}

export const requireAdmin: RequestHandler = async (req, res, next) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) })

  if (!session) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  if ((session.user as { role?: string }).role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" })
    return
  }

  res.locals.session = session
  next()
}
