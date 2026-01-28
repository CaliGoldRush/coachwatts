import { Command } from 'commander'
import chalk from 'chalk'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const sportSettingsCommand = new Command('sport-settings')

sportSettingsCommand
  .description('Check for mislabeled SportSettings (source="manual" but valid externalId)')
  .option('--prod', 'Use production database')
  .option('--fix', 'Fix the mislabeled records (update source to "intervals" or delete duplicates)')
  .action(async (options) => {
    const isProd = options.prod
    const shouldFix = options.fix
    const connectionString = isProd ? process.env.DATABASE_URL_PROD : process.env.DATABASE_URL

    if (isProd) {
      console.log(chalk.yellow('⚠️  Using PRODUCTION database.'))
    } else {
      console.log(chalk.blue('Using DEVELOPMENT database.'))
    }

    if (!connectionString) {
      console.error(chalk.red('Error: Database connection string is not defined.'))
      if (isProd) {
        console.error(chalk.red('Make sure DATABASE_URL_PROD is set in .env'))
      } else {
        console.error(chalk.red('Make sure DATABASE_URL is set in .env'))
      }
      process.exit(1)
    }

    const pool = new pg.Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })

    try {
      console.log(chalk.blue('Scanning for mislabeled sport settings...'))

      const badRecords = await prisma.sportSettings.findMany({
        where: {
          source: 'manual',
          NOT: {
            externalId: {
              startsWith: 'manual_'
            }
          }
        }
      })

      if (badRecords.length === 0) {
        console.log(chalk.green('✅ No mislabeled sport settings found.'))
        return
      }

      console.log(
        chalk.yellow(
          `Found ${badRecords.length} mislabeled sport settings (source='manual' but valid externalId).`
        )
      )

      if (!shouldFix) {
        console.log(chalk.blue('Run with --fix to correct these records.'))
        return
      }

      let fixed = 0
      let deleted = 0

      for (const record of badRecords) {
        if (!record.externalId) {
          console.log(chalk.gray(`Skipping record ${record.id} due to missing externalId`))
          continue
        }

        // Check for collision with correct record
        const exists = await prisma.sportSettings.findUnique({
          where: {
            userId_source_externalId: {
              userId: record.userId,
              source: 'intervals',
              externalId: record.externalId
            }
          }
        })

        if (exists) {
          console.log(
            chalk.red(
              `Duplicate found for user ${record.userId}, externalId ${record.externalId}. Deleting the mislabeled one.`
            )
          )
          await prisma.sportSettings.delete({ where: { id: record.id } })
          deleted++
        } else {
          console.log(
            chalk.green(
              `Fixing record ${record.id} for user ${record.userId} (setting source='intervals').`
            )
          )
          await prisma.sportSettings.update({
            where: { id: record.id },
            data: { source: 'intervals' }
          })
          fixed++
        }
      }

      console.log(chalk.green(`Done. Fixed: ${fixed}, Deleted: ${deleted}`))
    } catch (e) {
      console.error(chalk.red('Error checking sport settings:'), e)
      process.exit(1)
    } finally {
      await prisma.$disconnect()
      await pool.end()
    }
  })

export default sportSettingsCommand
