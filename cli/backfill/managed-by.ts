import { Command } from 'commander'
import chalk from 'chalk'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const backfillManagedByCommand = new Command('managed-by')

backfillManagedByCommand
  .description('Backfill managedBy field for PlannedWorkouts based on externalId and description')
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
      console.log(chalk.gray('Identifying AI-generated workouts...'))

      // 1. Identify by externalId prefix
      const prefixCandidates = await prisma.plannedWorkout.findMany({
        where: {
          OR: [
            { externalId: { startsWith: 'ai-gen-' } },
            { externalId: { startsWith: 'ai_gen_' } },
            { externalId: { startsWith: 'adhoc-' } }
          ],
          managedBy: { not: 'COACH_WATTS' } // Only find those not yet set
        },
        select: { id: true, externalId: true, title: true }
      })

      console.log(chalk.blue(`Found ${prefixCandidates.length} candidates by ID prefix.`))

      if (isDryRun) {
        prefixCandidates.forEach((w) =>
          console.log(`[DRY RUN] Would update (Prefix): ${w.externalId} - ${w.title}`)
        )
      } else {
        if (prefixCandidates.length > 0) {
          const ids = prefixCandidates.map((w) => w.id)
          const result = await prisma.plannedWorkout.updateMany({
            where: { id: { in: ids } },
            data: { managedBy: 'COACH_WATTS' }
          })
          console.log(chalk.green(`Updated ${result.count} workouts based on ID prefix.`))
        }
      }

      // 2. Identify by [CoachWatts] tag in description
      // Note: Prisma string filter 'contains' works for PostgreSQL
      const tagCandidates = await prisma.plannedWorkout.findMany({
        where: {
          description: { contains: '[CoachWatts]' },
          managedBy: { not: 'COACH_WATTS' } // Only find those not yet set (and not covered by previous step if we ran sequentially)
        },
        select: { id: true, externalId: true, title: true }
      })

      console.log(chalk.blue(`Found ${tagCandidates.length} candidates by [CoachWatts] tag.`))

      if (isDryRun) {
        tagCandidates.forEach((w) =>
          console.log(`[DRY RUN] Would update (Tag): ${w.externalId} - ${w.title}`)
        )
      } else {
        if (tagCandidates.length > 0) {
          const ids = tagCandidates.map((w) => w.id)
          const result = await prisma.plannedWorkout.updateMany({
            where: { id: { in: ids } },
            data: { managedBy: 'COACH_WATTS' }
          })
          console.log(chalk.green(`Updated ${result.count} workouts based on description tag.`))
        }
      }

      // 3. Identify by trainingWeekId (Part of a generated plan)
      const planCandidates = await prisma.plannedWorkout.findMany({
        where: {
          trainingWeekId: { not: null },
          managedBy: { not: 'COACH_WATTS' }
        },
        select: { id: true, externalId: true, title: true }
      })

      console.log(chalk.blue(`Found ${planCandidates.length} candidates by Training Plan link.`))

      if (isDryRun) {
        planCandidates.forEach((w) =>
          console.log(`[DRY RUN] Would update (Plan): ${w.externalId} - ${w.title}`)
        )
      } else {
        if (planCandidates.length > 0) {
          const ids = planCandidates.map((w) => w.id)
          const result = await prisma.plannedWorkout.updateMany({
            where: { id: { in: ids } },
            data: { managedBy: 'COACH_WATTS' }
          })
          console.log(chalk.green(`Updated ${result.count} workouts based on Training Plan link.`))
        }
      }
    } catch (e: any) {
      console.error(chalk.red('Error:'), e)
    } finally {
      await prisma.$disconnect()
      await pool.end()
    }
  })

export default backfillManagedByCommand
