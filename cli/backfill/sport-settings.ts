import { Command } from 'commander'
import chalk from 'chalk'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const backfillSportSettingsCommand = new Command('sport-settings')

backfillSportSettingsCommand
  .description('Create Default Sport Settings profile for users who do not have one')
  .option('--prod', 'Use production database')
  .option('--dry-run', 'Run without saving changes', false)
  .action(async (options) => {
    const isProd = options.prod
    const isDryRun = options.dryRun

    const connectionString = isProd ? process.env.DATABASE_URL_PROD : process.env.DATABASE_URL

    if (isProd) {
      if (!connectionString) {
        console.error(chalk.red('DATABASE_URL_PROD is not defined.'))
        process.exit(1)
      }
      console.log(chalk.yellow('⚠️  Using PRODUCTION database.'))
    } else {
      console.log(chalk.blue('Using DEVELOPMENT database.'))
    }

    if (isDryRun) {
      console.log(chalk.cyan('🔍 DRY RUN mode enabled. No changes will be saved.'))
    }

    const pool = new pg.Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })

    try {
      console.log(chalk.gray('Fetching Users...'))

      const users = await prisma.user.findMany({
        include: {
          sportSettings: {
            where: { isDefault: true }
          }
        }
      })

      console.log(chalk.gray(`Found ${users.length} users.`))

      let createdCount = 0
      let skippedCount = 0

      for (const user of users) {
        if (user.sportSettings.length > 0) {
          skippedCount++
          continue
        }

        if (isDryRun) {
          console.log(
            chalk.green(
              `[DRY RUN] Would create Default Sport Profile for: ${user.email} (${user.id})`
            )
          )
          console.log(chalk.gray(`  FTP: ${user.ftp}, LTHR: ${user.lthr}, MaxHR: ${user.maxHr}`))
        } else {
          console.log(chalk.blue(`Creating Default Sport Profile for: ${user.email}`))

          await prisma.sportSettings.create({
            data: {
              userId: user.id,
              name: 'Default',
              isDefault: true,
              types: [], // Empty types means generic/fallback
              source: 'system',
              externalId: `default_${user.id}`,

              // Copy Basic Settings
              ftp: user.ftp,
              lthr: user.lthr,
              maxHr: user.maxHr,
              restingHr: user.restingHr,

              // Copy Zones
              // Only if they are valid JSON arrays
              hrZones: (user.hrZones as any) || [],
              powerZones: (user.powerZones as any) || [],

              // Defaults
              warmupTime: 10,
              cooldownTime: 10,
              loadPreference: 'POWER_HR_PACE'
            }
          })
        }

        createdCount++
      }

      console.log('\n')
      console.log(chalk.bold('Summary:'))
      console.log(`Total Users:     ${users.length}`)
      console.log(`Created:         ${createdCount}`)
      console.log(`Skipped (Exist): ${skippedCount}`)

      if (isDryRun) {
        console.log(chalk.cyan('\nRun without --dry-run to apply changes.'))
      }
    } catch (e: any) {
      console.error(chalk.red('Error:'), e)
    } finally {
      await prisma.$disconnect()
      await pool.end()
    }
  })

export default backfillSportSettingsCommand
