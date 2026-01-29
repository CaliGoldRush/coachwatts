import { Command } from 'commander'
import chalk from 'chalk'
import 'dotenv/config'
import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const sourceCommand = new Command('source')

sourceCommand
  .description('Dump raw JSON source of wellness data for inspection')
  .option('--prod', 'Use production database')
  .option('--user <email>', 'Filter by user email')
  .option('--limit <number>', 'Limit results', '10')
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
      const where: any = {
        readiness: { not: null },
        rawJson: { not: Prisma.JsonNull }
      }

      if (options.user) {
        const user = await prisma.user.findUnique({ where: { email: options.user } })
        if (!user) {
          console.error(chalk.red(`User not found: ${options.user}`))
          process.exit(1)
        }
        where.userId = user.id
        console.log(chalk.green(`User found: ${user.name || user.email}`))
      }

      const records = await prisma.wellness.findMany({
        where,
        orderBy: { date: 'desc' },
        take: parseInt(options.limit),
        select: {
          id: true,
          date: true,
          readiness: true,
          rawJson: true,
          user: {
            select: { email: true }
          }
        }
      })

      console.log(chalk.gray(`Found ${records.length} records with readiness data.\n`))

      for (const record of records) {
        console.log(chalk.gray('--------------------------------------------------'))
        console.log(`User:            ${chalk.cyan(record.user.email)}`)
        console.log(`Date:            ${chalk.white(record.date.toISOString().split('T')[0])}`)
        console.log(`Readiness Value: ${chalk.yellow(record.readiness)}`)
        console.log(chalk.gray('Raw JSON Source:'))
        console.log(JSON.stringify(record.rawJson, null, 2))
      }
    } catch (e: any) {
      console.error(chalk.red('Error:'), e)
    } finally {
      await prisma.$disconnect()
    }
  })

export default sourceCommand
