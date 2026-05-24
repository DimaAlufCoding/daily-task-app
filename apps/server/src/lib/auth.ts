import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, disableSignUp: true },
  session: { storeSessionInDatabase: true },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "CLIENT", input: false },
    },
  },
})
