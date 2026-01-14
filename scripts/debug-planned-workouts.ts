import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const nextWeek = new Date(tomorrow)
  nextWeek.setDate(nextWeek.getDate() + 7)

  console.log(`Checking workouts between ${tomorrow.toISOString()} and ${nextWeek.toISOString()}`)

  const workouts = await prisma.plannedWorkout.findMany({
    where: {
      date: {
        gte: tomorrow,
        lte: nextWeek
      }
    }
  })

  console.log(`Found ${workouts.length} workouts.`)
  workouts.forEach((w) => {
    console.log(`${w.date.toISOString()} - ${w.title} (${w.id})`)
  })
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())
