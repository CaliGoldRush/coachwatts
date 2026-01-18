import { prisma } from '../server/utils/db'

async function main() {
  const userId = '6cbccf6c-e5a3-4df2-8305-2584e317f1ea'
  const dateStr = '2026-01-18'
  const targetId = '5265146d-7fdb-4d9f-a391-3493f7d693db'

  console.log(`Searching for workouts for user ${userId} on ${dateStr}...`)

  const startOfDay = new Date(dateStr)
  startOfDay.setUTCHours(0, 0, 0, 0)
  const endOfDay = new Date(dateStr)
  endOfDay.setUTCHours(23, 59, 59, 999)

  const workouts = await prisma.workout.findMany({
    where: {
      userId,
      date: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    include: {
      streams: { select: { id: true } }
    }
  })

  console.log(`Found ${workouts.length} workouts:`)
  workouts.forEach((w) => {
    console.log(`- [${w.id}] ${w.title} (${w.source})`)
    console.log(`  Date: ${w.date.toISOString()}`)
    console.log(`  Duration: ${w.durationSec}s`)
    console.log(`  Type: ${w.type}`)
    console.log(`  Duplicate: ${w.isDuplicate} (of ${w.duplicateOf})`)
    console.log(`  Streams: ${w.streams ? 'Yes' : 'No'}`)
    if (w.id === targetId) console.log('  *** TARGET ***')
    console.log('')
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
