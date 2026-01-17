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

  const workoutId = '8d910b32-7824-4298-beb3-d0bc81ec9d6d'

  try {
    const workout = await prisma.plannedWorkout.findUnique({
      where: { id: workoutId }
    })

    if (!workout) {
      console.log('Workout not found')
      return
    }

    console.log('Workout found:', workout)
    console.log(`Workout UserID: '${workout.userId}'`)

    const user = await prisma.user.findUnique({
      where: { id: workout.userId }
    })

    if (!user) {
      console.log('USER NOT FOUND!')
    } else {
      console.log('User found:', user.id)
    }
  } catch (error) {
    console.error(error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
