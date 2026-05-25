import { execSync } from 'child_process'
import path from 'path'
import { config } from 'dotenv'

config({ path: path.join(__dirname, '.env.test') })

const SERVER_DIR = path.resolve(__dirname, '../server')
const BUN = '~/.bun/bin/bun'
const BUNX = '~/.bun/bin/bunx'

export default async function globalSetup() {
  const testDbUrl = process.env.TEST_DATABASE_URL
  if (!testDbUrl) throw new Error('TEST_DATABASE_URL is not set in apps/e2e/.env.test')

  const env = { ...process.env, DATABASE_URL: testDbUrl }

  console.log('\n[e2e] Resetting test database...')
  execSync(`${BUNX} prisma migrate reset --force --skip-seed`, {
    cwd: SERVER_DIR,
    env,
    stdio: 'inherit',
  })

  console.log('[e2e] Seeding test admin...')
  execSync(`${BUN} run prisma/seed.ts`, {
    cwd: SERVER_DIR,
    env: {
      ...env,
      SEED_ADMIN_EMAIL: process.env.TEST_ADMIN_EMAIL!,
      SEED_ADMIN_PASSWORD: process.env.TEST_ADMIN_PASSWORD!,
    },
    stdio: 'inherit',
  })

  console.log('[e2e] Test database ready.\n')
}
