import { Command } from 'commander'
import chalk from 'chalk'
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const llmCommand = new Command('llm').description('LLM management commands')

llmCommand
  .command('update-model')
  .description('Update AI model preference for all users to Flash')
  .option('--prod', 'Use production database')
  .option('--dry', 'Dry run: print changes without applying them')
  .action(async (options) => {
    const isProd = options.prod
    const isDry = options.dry
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
      console.log(chalk.blue('Fetching users...'))
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          aiModelPreference: true
        }
      })

      console.log(chalk.blue(`Found ${users.length} users.`))

      // Defined in server/utils/gemini.ts
      const MODEL_MAPPINGS: Record<string, string> = {
        flash: 'gemini-flash-latest',
        pro: 'gemini-3-pro-preview'
      }

      const TARGET_MODEL = 'flash'
      const TARGET_API_MODEL = MODEL_MAPPINGS[TARGET_MODEL]

      console.log(chalk.cyan('\n--- Configuration ---'))
      console.log(chalk.cyan(`Target DB Value: '${TARGET_MODEL}'`))
      console.log(chalk.cyan(`Maps to API Model: '${TARGET_API_MODEL}'`))
      console.log(chalk.cyan('---------------------\n'))

      let updatedCount = 0
      const currentModels: Record<string, number> = {}

      for (const user of users) {
        const rawValue = user.aiModelPreference || 'null'
        currentModels[rawValue] = (currentModels[rawValue] || 0) + 1

        if (user.aiModelPreference !== TARGET_MODEL) {
          if (isDry) {
            console.log(
              chalk.yellow(
                `[DRY] Would update user ${user.email} (${user.id}) from '${rawValue}' to '${TARGET_MODEL}'`
              )
            )
          } else {
            console.log(
              chalk.blue(
                `Updating user ${user.email} (${user.id}) from '${rawValue}' to '${TARGET_MODEL}'`
              )
            )
            await prisma.user.update({
              where: { id: user.id },
              data: { aiModelPreference: TARGET_MODEL }
            })
          }
          updatedCount++
        }
      }

      console.log('\n--- Current Database Distribution ---')
      for (const [model, count] of Object.entries(currentModels)) {
        const mapping = MODEL_MAPPINGS[model]
        const status = mapping ? `(Maps to: ${mapping})` : chalk.red('(Unknown/Legacy)')
        console.log(`  '${model}': ${count} users ${status}`)
      }
      console.log('-------------------------------------')

      if (isDry) {
        console.log(
          chalk.yellow(`\n[DRY] Would update ${updatedCount} users to '${TARGET_MODEL}'.`)
        )
      } else {
        console.log(chalk.green(`\nUpdated ${updatedCount} users to '${TARGET_MODEL}'.`))
      }
    } catch (e) {
      console.error(chalk.red('Error updating users:'), e)
      process.exit(1)
    } finally {
      await prisma.$disconnect()
      await pool.end()
    }
  })

export default llmCommand
