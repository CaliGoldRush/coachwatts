import { Command } from 'commander'
import chalk from 'chalk'
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const calendarNotesCommand = new Command('calendar-notes')

calendarNotesCommand
  .description('Inspect and debug CalendarNote entries')
  .option('--prod', 'Use production database')
  .option('--user <email>', 'Filter by user email')
  .option('--title <title>', 'Filter by title (case-insensitive)')
  .option('--fix', 'Delete found CalendarNotes')
  .action(async (options) => {
    const isProd = options.prod
    const connectionString = isProd ? process.env.DATABASE_URL_PROD : process.env.DATABASE_URL

    if (isProd) {
      if (!connectionString) {
        console.error(chalk.red('DATABASE_URL_PROD is not defined.'))
        process.exit(1)
      }
      console.log(chalk.yellow('Using PRODUCTION database.'))
    } else {
      console.log(chalk.blue('Using DEVELOPMENT database.'))
    }

    const pool = new pg.Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })

    try {
      console.log(chalk.cyan('\n--- Analyzing Calendar Notes ---'))

      const where: any = {}
      if (options.user) {
        const user = await prisma.user.findUnique({ where: { email: options.user } })
        if (user) {
          where.userId = user.id
        } else {
          console.error(chalk.red(`User not found: ${options.user}`))
        }
      }

      if (options.title) {
        where.title = { contains: options.title, mode: 'insensitive' }
      }

      // If no filters are provided, warn/exit to prevent accidental mass deletion
      if (Object.keys(where).length === 0) {
        console.error(
          chalk.red('Error: You must provide at least --user or --title to filter records.')
        )
        return
      }

      const notes = await prisma.calendarNote.findMany({
        where,
        orderBy: { startDate: 'desc' },
        include: {
          user: {
            select: {
              email: true
            }
          }
        }
      })

      console.log(chalk.white(`\nFound ${notes.length} CalendarNotes.`))

      notes.forEach((n) => {
        console.log(
          `  ${chalk.green(n.startDate.toISOString().split('T')[0])} | ${chalk.yellow(
            n.title
          )} | ${chalk.blue(n.category)} | User: ${n.user.email} | Weekly: ${n.isWeeklyNote}`
        )
      })

      if (options.fix) {
        if (notes.length > 0) {
          console.log(chalk.yellow(`\nDeleting ${notes.length} CalendarNotes...`))
          const result = await prisma.calendarNote.deleteMany({ where })
          console.log(chalk.green(`Deleted ${result.count} records.`))
        } else {
          console.log(chalk.green('\nNothing to delete.'))
        }
      } else if (notes.length > 0) {
        console.log(chalk.yellow(`\nRun with --fix to delete these ${notes.length} items.`))
      }
    } catch (e: any) {
      console.error(chalk.red('Error:'), e)
    } finally {
      await prisma.$disconnect()
    }
  })

export default calendarNotesCommand
