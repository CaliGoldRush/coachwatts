import { Command } from 'commander'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import chalk from 'chalk'

const plannedCommand = new Command('planned')
  .description('Debug planned workouts')
  .option('--prod', 'Use production database')
  .action(async (options) => {
    const isProd = options.prod
    const connectionString = isProd ? process.env.DATABASE_URL_PROD : process.env.DATABASE_URL

    if (isProd) {
      console.log(chalk.yellow('Using PRODUCTION database.'))
    } else {
      console.log(chalk.blue('Using DEVELOPMENT database.'))
    }

    const pool = new pg.Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })

    try {
      const tomorrow = new Date()
      // tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)

      const nextWeek = new Date(tomorrow)
      nextWeek.setDate(nextWeek.getDate() + 7)

      console.log(
        `Checking workouts between ${tomorrow.toISOString()} and ${nextWeek.toISOString()}`
      )

      const workouts = await prisma.plannedWorkout.findMany({
        where: {
          date: {
            gte: tomorrow,
            lte: nextWeek
          }
        },
        orderBy: { date: 'asc' }
      })

      console.log(`Found ${workouts.length} workouts.`)
      workouts.forEach((w) => {
        console.log(
          `${w.date.toISOString()} - ${w.title} (ID: ${w.id}) [Week: ${w.trainingWeekId}]`
        )
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      await prisma.$disconnect()
    }
  })

export default plannedCommand
