import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

async function main() {
  const connectionString = process.env.DATABASE_URL_PROD
  if (!connectionString) {
    console.error('DATABASE_URL_PROD is not defined')
    process.exit(1)
  }

  const pool = new pg.Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    // 1. Get all distinct userIds from PlannedWorkout
    const distinctUserIds = await prisma.plannedWorkout.findMany({
      select: { userId: true },
      distinct: ['userId']
    })

    const plannedWorkoutUserIds = distinctUserIds.map((u) => u.userId)
    console.log(`Found ${plannedWorkoutUserIds.length} distinct userIds in PlannedWorkout.`)

    // 2. Check which ones exist in User table
    const existingUsers = await prisma.user.findMany({
      where: {
        id: { in: plannedWorkoutUserIds }
      },
      select: { id: true }
    })

    const existingUserIds = new Set(existingUsers.map((u) => u.id))

    // 3. Find orphans
    const orphans = plannedWorkoutUserIds.filter((id) => !existingUserIds.has(id))

    if (orphans.length > 0) {
      console.log('Found orphan userIds in PlannedWorkout:', orphans)

      // Count how many workouts are affected
      const orphanWorkoutsCount = await prisma.plannedWorkout.count({
        where: {
          userId: { in: orphans }
        }
      })
      console.log(`Total orphan PlannedWorkouts: ${orphanWorkoutsCount}`)

      // List some orphan workout IDs
      const sampleOrphans = await prisma.plannedWorkout.findMany({
        where: {
          userId: { in: orphans }
        },
        take: 5,
        select: { id: true, title: true, userId: true }
      })
      console.log('Sample orphan workouts:', sampleOrphans)
    } else {
      console.log('No orphan PlannedWorkouts found. All userIds exist in User table.')
    }
  } catch (error) {
    console.error(error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
