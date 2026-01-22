import { Command } from 'commander'
import chalk from 'chalk'
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const whoopStatsCommand = new Command('whoop')

whoopStatsCommand
  .description('Show Whoop webhook status and recent events')
  .option('--prod', 'Use DATABASE_URL_PROD from .env')
  .option('-l, --limit <number>', 'Limit number of recent logs', '20')
  .action(async (options) => {
    const dbUrl = options.prod ? process.env.DATABASE_URL_PROD : process.env.DATABASE_URL
    const limit = parseInt(options.limit)

    if (!dbUrl) {
      console.error(chalk.red('Error: DATABASE_URL (or DATABASE_URL_PROD) is not set.'))
      process.exit(1)
    }

    if (options.prod) {
      console.log(chalk.yellow('Using PRODUCTION database.'))
    } else {
      console.log(chalk.blue('Using DEVELOPMENT database.'))
    }

    const pool = new pg.Pool({ connectionString: dbUrl })
    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })

    try {
      console.log(chalk.blue(`Fetching Whoop webhook status...`))

      // 1. Status breakdown (last 7 days)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const statusBreakdown: any[] = await prisma.$queryRaw`
        SELECT 
          status, 
          count(*)::int as count
        FROM "WebhookLog"
        WHERE provider = 'whoop' AND "createdAt" >= ${weekAgo}
        GROUP BY 1
        ORDER BY 2 DESC;
      `

      console.log(chalk.bold('\n--- Status Breakdown (Last 7 Days) ---'))
      if (statusBreakdown.length === 0) {
        console.log(chalk.gray('No Whoop webhooks found in the last 7 days.'))
      } else {
        statusBreakdown.forEach((s) => {
          let color = chalk.white
          if (s.status === 'PROCESSED' || s.status === 'QUEUED') color = chalk.green
          if (s.status === 'FAILED') color = chalk.red
          if (s.status === 'PENDING') color = chalk.yellow
          console.log(`${s.status.padEnd(12)}: ${color(s.count)}`)
        })
      }

      // 2. Recent Logs
      const logs = await prisma.webhookLog.findMany({
        where: { provider: 'whoop' },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      console.log(chalk.bold(`\n--- Recent Whoop Webhooks (Last ${logs.length}) ---`))
      if (logs.length === 0) {
        console.log(chalk.gray('No Whoop webhooks found.'))
      } else {
        const tableData = logs.map((log) => {
          const payload = (log.payload as any) || {}
          return {
            Time: log.createdAt.toLocaleString(),
            Event: log.eventType || 'UNKNOWN',
            Status: log.status,
            User: payload.user_id || 'N/A',
            Error: log.error ? (log.error.length > 30 ? log.error.substring(0, 27) + '...' : log.error) : ''
          }
        })
        console.table(tableData)
      }

      // 3. Detailed Errors for FAILED logs (last 24 hours)
      const dayAgo = new Date()
      dayAgo.setHours(dayAgo.getHours() - 24)

      const failedLogs = await prisma.webhookLog.findMany({
        where: {
          provider: 'whoop',
          status: 'FAILED',
          createdAt: { gte: dayAgo }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })

      if (failedLogs.length > 0) {
        console.log(chalk.bold.red('\n--- Recent Errors (Last 24 Hours, max 5) ---'))
        failedLogs.forEach((log) => {
          console.log(chalk.red(`[${log.createdAt.toLocaleString()}] ${log.eventType}`))
          console.log(chalk.gray(`ID: ${log.id}`))
          console.log(chalk.white(`Error: ${log.error}`))
          console.log(chalk.gray('---'))
        })
      }
    } catch (error: any) {
      console.error(chalk.red('Error fetching Whoop stats:'), error.message)
    } finally {
      await prisma.$disconnect()
      await pool.end()
    }
  })

export default whoopStatsCommand
