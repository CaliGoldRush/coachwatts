import { Command } from 'commander'
import chalk from 'chalk'
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const candidatesCommand = new Command('candidates')

candidatesCommand
  .description('Find users whose wellness data suggests non-standard scales (e.g. Polar 1-6)')
  .option('--prod', 'Use production database')
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
      console.log(chalk.gray('Scanning wellness data for scale anomalies...'))

      // Find users who have readiness data
      const users = await prisma.wellness.findMany({
        where: { readiness: { not: null } },
        select: { userId: true, readiness: true }
      })

      const userStats = new Map<
        string,
        { min: number; max: number; count: number; values: number[] }
      >()

      for (const u of users) {
        if (u.readiness === null) continue
        const val = u.readiness
        if (!userStats.has(u.userId)) {
          userStats.set(u.userId, { min: val, max: val, count: 0, values: [] })
        }
        const stats = userStats.get(u.userId)!
        stats.min = Math.min(stats.min, val)
        stats.max = Math.max(stats.max, val)
        stats.count++
        if (stats.values.length < 20) stats.values.push(val)
      }

      console.log(chalk.bold('\nUser Readiness Stats:'))
      for (const [userId, stats] of userStats.entries()) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true }
        })

        const isSuspicious = stats.max <= 10 // Likely 1-10 or 1-6 scale instead of 0-100
        const color = isSuspicious ? chalk.yellow : chalk.green

        console.log(`User: ${chalk.cyan(user?.email || userId)}`)
        console.log(`  Range: ${color(`${stats.min} - ${stats.max}`)}`)
        console.log(`  Count: ${stats.count}`)
        console.log(`  Sample: ${chalk.gray(stats.values.join(', '))}`)
        console.log(chalk.gray('-----------------------------------'))
      }
    } catch (e: any) {
      console.error(chalk.red('Error:'), e)
    } finally {
      await prisma.$disconnect()
    }
  })

export default candidatesCommand
