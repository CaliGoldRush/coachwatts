import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

async function main() {
  const connectionString = process.env.DATABASE_URL_PROD
  const pool = new pg.Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  const userId = '4b5c116e-73eb-4254-90b0-f6a55d5e0ee7'

  try {
    // 1. Check User directly via SQL
    const user = await prisma.$queryRaw`SELECT id FROM "User" WHERE id = ${userId}`
    console.log('User from SQL:', user)

    // 2. Check CalendarNote constraints
    const constraints = await prisma.$queryRaw`
      SELECT conname AS constraint_name, contype AS constraint_type, 
             pg_catalog.pg_get_constraintdef(r.oid, true) as definition
      FROM pg_catalog.pg_constraint r
      WHERE r.conrelid = 'CalendarNote'::regclass;
    `
    console.log('CalendarNote Constraints:', constraints)
  } catch (error) {
    console.error(error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
