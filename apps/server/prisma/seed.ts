import "dotenv/config"
import { hashPassword } from "@better-auth/utils/password"
import { Role } from "@prisma/client"
import { prisma } from "../src/lib/prisma"

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env")
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`Admin already exists: ${email}`)
    return
  }

  const userId = crypto.randomUUID()
  const accountId = crypto.randomUUID()
  const now = new Date()

  await prisma.user.create({
    data: {
      id: userId,
      name: "Admin",
      email,
      emailVerified: true,
      role: Role.ADMIN,
      createdAt: now,
      updatedAt: now,
      accounts: {
        create: {
          id: accountId,
          accountId: email,
          providerId: "credential",
          password: await hashPassword(password),
          createdAt: now,
          updatedAt: now,
        },
      },
    },
  })

  console.log(`Admin created: ${email}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
