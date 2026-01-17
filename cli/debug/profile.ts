import { Command } from 'commander'
import chalk from 'chalk'
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const debugProfileCommand = new Command('profile')

debugProfileCommand.description('Debug user profiles').option('--prod', 'Use production database')

debugProfileCommand
  .command('list')
  .description('List recent users')
  .option('-n, --limit <number>', 'Number of users to list', '10')
  .action(async (options) => {
    const isProd = debugProfileCommand.opts().prod
    const connectionString = isProd ? process.env.DATABASE_URL_PROD : process.env.DATABASE_URL

    if (isProd) {
      console.log(chalk.yellow('Using PRODUCTION database.'))
    } else {
      console.log(chalk.blue('Using DEVELOPMENT database.'))
    }

    if (!connectionString) {
      console.error(chalk.red('Database connection string is not defined.'))
      process.exit(1)
    }

    const pool = new pg.Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })

    try {
      const users = await prisma.user.findMany({
        orderBy: { updatedAt: 'desc' },
        take: parseInt(options.limit),
        select: {
          id: true,
          name: true,
          email: true,
          country: true,
          updatedAt: true
        }
      })

      console.log(chalk.bold('\nRecent Users:'))
      console.table(
        users.map((u) => ({
          ID: u.id,
          Name: u.name,
          Email: u.email,
          Country: u.country || chalk.gray('(null)'),
          Updated: u.updatedAt.toISOString().split('T')[0]
        }))
      )
    } catch (e) {
      console.error(chalk.red('Error listing users:'), e)
    } finally {
      await prisma.$disconnect()
      await pool.end()
    }
  })

debugProfileCommand
  .command('show')
  .description('Show full profile for a user')
  .argument('<identifier>', 'User ID or Email')
  .action(async (identifier, options) => {
    const isProd = debugProfileCommand.opts().prod
    const connectionString = isProd ? process.env.DATABASE_URL_PROD : process.env.DATABASE_URL

    if (isProd) {
      console.log(chalk.yellow('Using PRODUCTION database.'))
    } else {
      console.log(chalk.blue('Using DEVELOPMENT database.'))
    }

    if (!connectionString) {
      console.error(chalk.red('Database connection string is not defined.'))
      process.exit(1)
    }

    const pool = new pg.Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })

    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ id: identifier }, { email: identifier }]
        },
        include: {
          sportSettings: true
        }
      })

      if (!user) {
        console.error(chalk.red(`User not found: ${identifier}`))
        return
      }

      console.log(chalk.bold(`\n=== User Profile: ${user.name || 'Unknown'} ===`))
      console.log(`ID:      ${chalk.cyan(user.id)}`)
      console.log(`Email:   ${chalk.cyan(user.email)}`)

      console.log(chalk.bold('\n-- Core Settings --'))
      console.log(`Country: ${user.country ? chalk.green(user.country) : chalk.red('(null)')}`)
      console.log(`City:    ${user.city || chalk.gray('(null)')}`)
      console.log(`State:   ${user.state || chalk.gray('(null)')}`)
      console.log(`Timezone:${user.timezone || chalk.gray('(null)')}`)

      console.log(chalk.bold('\n-- Physical --'))
      console.log(`Weight:  ${user.weight} ${user.weightUnits}`)
      console.log(`Height:  ${user.height} ${user.heightUnits}`)
      console.log(`FTP:     ${user.ftp} W`)
      console.log(`Max HR:  ${user.maxHr} bpm`)
      console.log(chalk.gray(`Legacy HR Zones: ${JSON.stringify(user.hrZones || 'Default')}`))
      console.log(chalk.gray(`Legacy Power Zones: ${JSON.stringify(user.powerZones || 'Default')}`))

      if (user.sportSettings && user.sportSettings.length > 0) {
        console.log(chalk.bold('\n-- Sport Settings --'))
        user.sportSettings.forEach((s) => {
          console.log(chalk.green(`\n[${s.name}] ${s.isDefault ? '(Default)' : ''}`))
          console.log(`  Types: ${s.types.join(', ')}`)
          console.log(`  FTP:   ${s.ftp} W`)
          console.log(`  LTHR:  ${s.lthr} bpm`)
          console.log(`  MaxHR: ${s.maxHr} bpm`)
          console.log(
            `  HR Zones: ${s.hrZones ? JSON.stringify(s.hrZones).substring(0, 100) + '...' : 'null'}`
          )
          console.log(
            `  Pwr Zones: ${s.powerZones ? JSON.stringify(s.powerZones).substring(0, 100) + '...' : 'null'}`
          )
        })
      } else {
        console.log(chalk.yellow('\n-- No Sport Settings Found --'))
      }

      console.log(chalk.bold('\n-- System --'))
      console.log(`Created: ${user.createdAt.toISOString()}`)
      console.log(`Updated: ${user.updatedAt.toISOString()}`)
    } catch (e) {
      console.error(chalk.red('Error fetching user:'), e)
    } finally {
      await prisma.$disconnect()
      await pool.end()
    }
  })

export default debugProfileCommand
