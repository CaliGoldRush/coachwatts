import { Command } from 'commander'
import chalk from 'chalk'
import { prisma } from '../../server/utils/db'
import { sportSettingsRepository } from '../../server/utils/repositories/sportSettingsRepository'

const migrateZonesCommand = new Command('migrate-zones')

// Methodology Constants (matching Frontend)
const POWER_PCT = [0.55, 0.75, 0.9, 1.05, 1.2, 1.5, 9.99]
const POWER_NAMES = [
  'Z1 Active Recovery',
  'Z2 Endurance',
  'Z3 Tempo',
  'Z4 Threshold',
  'Z5 VO2 Max',
  'Z6 Anaerobic',
  'Z7 Neuromuscular'
]

const HR_PCT = [0.8, 0.89, 0.93, 0.99, 1.02, 1.05, 1.1]
const HR_NAMES = [
  'Z1 Recovery',
  'Z2 Aerobic',
  'Z3 Tempo',
  'Z4 SubThreshold',
  'Z5 SuperThreshold',
  'Z6 Aerobic Capacity',
  'Z7 Anaerobic'
]

function calculatePowerZones(ftp: number) {
  return POWER_PCT.map((pct, i) => {
    const prevPct = i === 0 ? 0 : (POWER_PCT[i - 1] ?? 0)
    return {
      name: POWER_NAMES[i],
      min: Math.round(ftp * prevPct) + (i === 0 ? 0 : 1),
      max: pct > 5 ? 2000 : Math.round(ftp * pct)
    }
  })
}

function calculateHrZones(lthr: number | null, maxHr: number | null) {
  const threshold = lthr || (maxHr ? Math.round(maxHr * 0.85) : 160)
  const calcMaxHr = maxHr || Math.round(threshold * 1.1)

  return HR_PCT.map((pct, i) => {
    const prevPct = i === 0 ? 0 : (HR_PCT[i - 1] ?? 0)
    return {
      name: HR_NAMES[i],
      min: Math.round(threshold * prevPct) + (i === 0 ? 0 : 1),
      max: i === HR_PCT.length - 1 ? calcMaxHr : Math.round(threshold * pct)
    }
  })
}

migrateZonesCommand
  .description('Migrate custom zones (HR/Power) from User model to SportSettings')
  .option('--force', 'Force re-creation of default profiles even if they exist')
  .action(async (options) => {
    console.log(chalk.blue('🚀 Starting Custom Zones Migration...'))

    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          hrZones: true,
          powerZones: true,
          ftp: true,
          maxHr: true,
          lthr: true,
          restingHr: true
        }
      })

      console.log(chalk.gray(`Found ${users.length} users to process.`))

      let migrated = 0
      let skipped = 0
      let errors = 0

      for (const user of users) {
        try {
          const existingDefault = await prisma.sportSettings.findFirst({
            where: { userId: user.id, isDefault: true }
          })

          // Determine optimal zones (Legacy > Calculated > Empty)
          let finalHrZones = (user.hrZones as any[]) || []
          let finalPowerZones = (user.powerZones as any[]) || []

          if (finalPowerZones.length === 0 && user.ftp) {
            console.log(chalk.gray(`  Calculated Power Zones for ${user.email} (FTP: ${user.ftp})`))
            finalPowerZones = calculatePowerZones(user.ftp)
          }

          if (finalHrZones.length === 0 && (user.lthr || user.maxHr)) {
            console.log(chalk.gray(`  Calculated HR Zones for ${user.email}`))
            finalHrZones = calculateHrZones(user.lthr, user.maxHr)
          }

          if (existingDefault && !options.force) {
            // Check if existing default is empty but we have calculated ones now?
            // If the user didn't ask for force, we skip.
            console.log(
              chalk.yellow(`Skipping user ${user.email} - Default profile already exists.`)
            )
            skipped++
            continue
          }

          if (existingDefault && options.force) {
            console.log(chalk.cyan(`Updating existing default profile for ${user.email}...`))
            await prisma.sportSettings.update({
              where: { id: existingDefault.id },
              data: {
                hrZones: finalHrZones,
                powerZones: finalPowerZones,
                ftp: user.ftp,
                maxHr: user.maxHr,
                lthr: user.lthr,
                restingHr: user.restingHr
              }
            })
          } else {
            console.log(chalk.green(`Creating default profile for ${user.email}...`))

            // We can't use sportSettingsRepository.createDefault because it doesn't take our calculated zones
            // So we create manually
            await prisma.sportSettings.create({
              data: {
                userId: user.id,
                name: 'Default',
                isDefault: true,
                types: [],
                source: 'system',
                externalId: `default_${user.id}`,
                ftp: user.ftp,
                lthr: user.lthr,
                maxHr: user.maxHr,
                restingHr: user.restingHr,
                hrZones: finalHrZones,
                powerZones: finalPowerZones,
                warmupTime: 10,
                cooldownTime: 10,
                loadPreference: 'POWER_HR_PACE'
              }
            })
          }

          migrated++
        } catch (err) {
          console.error(chalk.red(`Error migrating user ${user.email}:`), err)
          errors++
        }
      }

      console.log(chalk.bold('\nMigration Results:'))
      console.log(`Total Users: ${users.length}`)
      console.log(`Migrated:    ${migrated}`)
      console.log(`Skipped:     ${skipped}`)
      console.log(`Errors:      ${errors}`)
    } catch (error) {
      console.error(chalk.red('Fatal error during migration:'), error)
    } finally {
      await prisma.$disconnect()
    }
  })

export default migrateZonesCommand
