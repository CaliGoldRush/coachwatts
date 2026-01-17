import 'dotenv/config'
import { prisma } from '../server/utils/db'
import { sportSettingsRepository } from '../server/utils/repositories/sportSettingsRepository'
import chalk from 'chalk'

async function main() {
  console.log(chalk.blue('Starting Default Profile Backfill...'))

  const users = await prisma.user.findMany({
    select: { id: true, email: true }
  })

  console.log(`Found ${users.length} users. Checking profiles...`)

  const created = 0
  let existing = 0
  let errors = 0

  for (const user of users) {
    try {
      // getByUserId internally triggers lazy creation if default is missing
      const settings = await sportSettingsRepository.getByUserId(user.id)
      const hasDefault = settings.some((s) => s.isDefault)

      if (hasDefault) {
        // We can't easily tell if it was JUST created or existed,
        // but if the repo logic works, it's there now.
        // To be precise we'd need to check before calling getByUserId,
        // but the goal is just to ensure existence.
        existing++
        // (Technically creates are counted as existing here since we don't distinguish,
        // but the important part is they exist now).
      } else {
        console.warn(
          chalk.yellow(
            `User ${user.email} (${user.id}) still has no default profile after access attempt.`
          )
        )
        errors++
      }
    } catch (e) {
      console.error(chalk.red(`Error processing user ${user.email}:`), e)
      errors++
    }
  }

  console.log(chalk.bold('\nBackfill Complete.'))
  console.log(`Processed: ${users.length}`)
  console.log(`Verified/Created: ${existing}`)
  console.log(`Errors: ${errors}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
