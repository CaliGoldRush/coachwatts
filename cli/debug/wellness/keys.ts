import { Command } from 'commander'
import chalk from 'chalk'
import 'dotenv/config'
import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const keysCommand = new Command('keys')

keysCommand
  .description('Scan wellness rawJson for all unique keys to find source identifiers')
  .option('--prod', 'Use production database')
  .option('--limit <number>', 'Limit records to scan (default: all)', '0')
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
      console.log(chalk.gray('Fetching wellness records with raw data...'))

      const limit = parseInt(options.limit)
      const records = await prisma.wellness.findMany({
        where: {
          rawJson: { not: Prisma.JsonNull }
        },
        select: {
          rawJson: true
        },
        take: limit > 0 ? limit : undefined,
        orderBy: { date: 'desc' }
      })

      console.log(chalk.gray(`Scanning ${records.length} records...`))

      const topLevelKeys = new Set<string>()
      const secondLevelKeys = new Map<string, Set<string>>()

      for (const record of records) {
        const raw = record.rawJson as any
        if (!raw || typeof raw !== 'object') continue

        Object.keys(raw).forEach((key) => {
          topLevelKeys.add(key)

          // If it's an object, track its keys too (skip arrays/nulls)
          if (raw[key] && typeof raw[key] === 'object' && !Array.isArray(raw[key])) {
            if (!secondLevelKeys.has(key)) {
              secondLevelKeys.set(key, new Set())
            }
            Object.keys(raw[key]).forEach((subKey) => {
              secondLevelKeys.get(key)!.add(subKey)
            })
          }
        })
      }

      console.log(chalk.bold.cyan('\nTop Level Keys Found:'))
      console.log(Array.from(topLevelKeys).sort().join(', '))

      console.log(chalk.bold.cyan('\nNested Objects Keys:'))
      for (const [parent, children] of secondLevelKeys.entries()) {
        // Only show interesting objects (skip common ones if list is huge, or show all)
        // Let's show all but maybe filter out huge ones if needed.
        if (children.size > 0) {
          console.log(
            chalk.yellow(`${parent}: `) + chalk.gray(Array.from(children).sort().join(', '))
          )
        }
      }
    } catch (e: any) {
      console.error(chalk.red('Error:'), e)
    } finally {
      await prisma.$disconnect()
    }
  })

export default keysCommand
