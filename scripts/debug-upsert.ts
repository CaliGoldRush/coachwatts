import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { calendarNoteRepository } from '../server/utils/repositories/calendarNoteRepository'

async function main() {
  const connectionString = process.env.DATABASE_URL_PROD
  const pool = new pg.Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  const userId = '4b5c116e-73eb-4254-90b0-f6a55d5e0ee7'
  const externalId = 'TEST_DEBUG_1'

  try {
    console.log(`Attempting to create CalendarNote for user ${userId}`)

    // Check if user exists (again)
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      console.error('User does not exist!')
      return
    }
    console.log('User exists.')

    const data = {
      userId,
      externalId,
      source: 'intervals',
      startDate: new Date(),
      title: 'Debug Note',
      category: 'NOTE',
      isWeeklyNote: false
    }

    const result = await calendarNoteRepository.upsert(userId, 'intervals', externalId, data)
    console.log('Success:', result)

    // Clean up
    await calendarNoteRepository.deleteExternal(userId, 'intervals', [externalId])
  } catch (error) {
    console.error('Failed:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
