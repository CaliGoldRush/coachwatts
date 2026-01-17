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
    console.log(`Attempting SQL INSERT for user ${userId}`)

    // Note: Quoting table and column names to match Prisma's case sensitivity
    await prisma.$executeRawUnsafe(`
      INSERT INTO "CalendarNote" ("id", "userId", "date", "title", "category", "externalId", "source", "updatedAt")
      VALUES ('test-uuid-123', '${userId}', NOW(), 'SQL Test', 'NOTE', 'SQL_TEST', 'intervals', NOW())
    `)

    console.log('SQL INSERT Success!')

    // Clean up
    await prisma.$executeRawUnsafe(`DELETE FROM "CalendarNote" WHERE "id" = 'test-uuid-123'`)
  } catch (error) {
    console.error('SQL INSERT Failed:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
