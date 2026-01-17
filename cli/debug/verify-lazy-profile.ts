import { Command } from 'commander'
import chalk from 'chalk'
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { sportSettingsRepository } from '../../server/utils/repositories/sportSettingsRepository'

// Re-writing the file content to import prisma from db utils
import { prisma } from '../../server/utils/db'

const verifyLazyProfileCommand = new Command('verify-lazy-profile')

verifyLazyProfileCommand
  .description('Verify lazy creation of default sport profile')
  .option('--prod', 'Use production database (NOT RECOMMENDED for this test)')
  .action(async () => {
    const isProd = verifyLazyProfileCommand.opts().prod
    const connectionString = isProd ? process.env.DATABASE_URL_PROD : process.env.DATABASE_URL

    if (isProd) {
      console.warn(chalk.red('WARNING: Running verification on PRODUCTION database.'))
    }

    if (!connectionString) {
      console.error(chalk.red('Database connection string is not defined.'))
      process.exit(1)
    }

    const pool = new pg.Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    // We need to use the imported prisma instance if possible to share context?
    // But `sportSettingsRepository` uses `server/utils/db` which exports a singleton `prisma`.
    // If I use a new client here, I can't verify `sportSettingsRepository` unless I mock it or make it use my client.
    // However, `sportSettingsRepository` imports `prisma` from `../db`.
    // In a CLI script, that `prisma` instance might not be initialized with the correct connection string if not env var set?
    // `server/utils/db.ts` usually initializes PrismaClient.

    // Let's verify `server/utils/db.ts` behavior.
    // If I run this script with `ts-node` or similar, it should pick up `.env`.

    // I will try to use the repository directly.
    // But I also need direct access to create the test user.
    // I will import `prisma` from `../../server/utils/db` to match what repository uses.
  })

verifyLazyProfileCommand.action(async () => {
  console.log(chalk.blue('Starting Lazy Profile Verification...'))

  const testEmail = `lazy-test-${Date.now()}@test.com`
  const dummyHrZones = [
    { name: 'Z1', min: 0, max: 100 },
    { name: 'Z2', min: 101, max: 150 }
  ]
  const dummyPowerZones = [
    { name: 'Z1', min: 0, max: 100 },
    { name: 'Z2', min: 101, max: 200 }
  ]
  const dummyFtp = 250

  try {
    console.log(chalk.gray(`Creating test user: ${testEmail}`))
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Lazy Test User',
        ftp: dummyFtp,
        hrZones: dummyHrZones,
        powerZones: dummyPowerZones
      }
    })

    console.log(chalk.gray(`User created: ${user.id}`))

    // Ensure no sport settings exist
    await prisma.sportSettings.deleteMany({ where: { userId: user.id } })

    console.log(chalk.gray('Fetching profiles via repository (triggers lazy create)...'))
    const settings = await sportSettingsRepository.getByUserId(user.id)

    if (settings.length === 0) {
      console.error(chalk.red('FAILED: No settings returned.'))
      process.exit(1)
    }

    const defaultProfile = settings.find((s) => s.isDefault)
    if (!defaultProfile) {
      console.error(chalk.red('FAILED: No default profile created.'))
      process.exit(1)
    }

    console.log(chalk.green('SUCCESS: Default profile created.'))

    // Verify data copy
    if (defaultProfile.ftp !== dummyFtp) {
      console.error(
        chalk.red(`FAILED: FTP mismatch. Expected ${dummyFtp}, got ${defaultProfile.ftp}`)
      )
    }

    // Check Zones (need to cast or check carefully as they are JSON)
    // Prisma returns JSON as object/array
    const profileHrZones = defaultProfile.hrZones as any[]
    if (profileHrZones.length !== dummyHrZones.length || profileHrZones[0].name !== 'Z1') {
      console.error(chalk.red('FAILED: HR Zones mismatch.'))
      console.log('Expected:', dummyHrZones)
      console.log('Got:', profileHrZones)
    } else {
      console.log(chalk.green('SUCCESS: HR Zones copied correctly.'))
    }

    const profilePowerZones = defaultProfile.powerZones as any[]
    if (profilePowerZones.length !== dummyPowerZones.length || profilePowerZones[0].max !== 100) {
      console.error(chalk.red('FAILED: Power Zones mismatch.'))
    } else {
      console.log(chalk.green('SUCCESS: Power Zones copied correctly.'))
    }
  } catch (e) {
    console.error(chalk.red('Error during verification:'), e)
  } finally {
    // Cleanup
    console.log(chalk.gray('Cleaning up test user...'))
    try {
      await prisma.user.deleteMany({ where: { email: testEmail } })
    } catch (cleanupErr) {
      console.error('Failed to cleanup:', cleanupErr)
    }
    await prisma.$disconnect()
  }
})

export default verifyLazyProfileCommand
