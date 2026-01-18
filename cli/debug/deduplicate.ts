import { Command } from 'commander'
import { prisma } from '../../server/utils/db'
import { workoutRepository } from '../../server/utils/repositories/workoutRepository'
import { deduplicationService } from '../../server/utils/services/deduplicationService'

const deduplicateCommand = new Command('deduplicate')

deduplicateCommand
  .description('Run workout deduplication logic for a user')
  .requiredOption('-u, --user <email_or_id>', 'User Email or ID')
  .option('--dry-run', 'Run in dry-run mode (no changes)', false)
  .action(async (options) => {
    const { user: userIdInput, dryRun } = options

    console.log(`Running deduplication for user: ${userIdInput} (Dry Run: ${dryRun})`)

    let actualUserId = userIdInput
    if (userIdInput.includes('@')) {
      const user = await prisma.user.findUnique({ where: { email: userIdInput } })
      if (!user) {
        console.error('User not found')
        process.exit(1)
      }
      actualUserId = user.id
    }

    const workouts = await workoutRepository.getForUser(actualUserId, {
      includeDuplicates: true,
      orderBy: { date: 'desc' },
      include: {
        streams: { select: { id: true } },
        exercises: { select: { id: true } }
      }
    })

    console.log(`Loaded ${workouts.length} workouts`)

    const groups = deduplicationService.findDuplicateGroups(workouts)
    console.log(`Found ${groups.length} duplicate groups`)

    for (const group of groups) {
      console.log('\n--- Duplicate Group ---')
      const best = group.workouts.find((w) => w.id === group.bestWorkoutId)
      console.log(`Best: [${best.source}] ${best.title} (${best.id})`)

      const others = group.workouts.filter((w) => w.id !== group.bestWorkoutId)
      others.forEach((o) => {
        console.log(`  Duplicate: [${o.source}] ${o.title} (${o.id})`)
      })

      if (!dryRun) {
        console.log('Merging...')
        const result = await deduplicationService.mergeDuplicateGroup(group)
        console.log(`Merged! Deleted: ${result.deletedCount}, Kept: ${result.keptCount}`)
      }
    }

    console.log('\nDone.')
  })

export default deduplicateCommand
