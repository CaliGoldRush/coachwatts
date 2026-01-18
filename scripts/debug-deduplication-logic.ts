import { prisma } from '../server/utils/db'

// COPY OF LOGIC FROM trigger/deduplicate-workouts.ts
function findDuplicateGroups(workouts: any[]): any[] {
  const groups: any[] = []
  const processed = new Set<string>()

  for (let i = 0; i < workouts.length; i++) {
    if (processed.has(workouts[i].id)) continue

    const workout = workouts[i]
    const duplicates = [workout]
    processed.add(workout.id)

    for (let j = i + 1; j < workouts.length; j++) {
      if (processed.has(workouts[j].id)) continue

      const other = workouts[j]

      if (areDuplicates(workout, other)) {
        duplicates.push(other)
        processed.add(other.id)
      }
    }

    if (duplicates.length > 1) {
      groups.push({
        workouts: duplicates,
        bestWorkoutId: duplicates[0].id // Simplified for debug
      })
    }
  }

  return groups
}

function areDuplicates(w1: any, w2: any): boolean {
  const timeDiff = Math.abs(new Date(w1.date).getTime() - new Date(w2.date).getTime())

  console.log(`Comparing [${w1.id}] vs [${w2.id}]`)
  console.log(`  Time Diff: ${timeDiff}ms`)

  let maxTimeDiff = 30 * 60 * 1000
  const diffInHours = timeDiff / (60 * 60 * 1000)
  const diffHoursRemainder = Math.abs(diffInHours - Math.round(diffInHours))
  const isTimezoneShift = diffInHours >= 1 && diffInHours <= 14 && diffHoursRemainder < 5 / 60

  if (isTimezoneShift) {
    maxTimeDiff = timeDiff + 1000
    console.log(`  Timezone shift detected`)
  }

  if (timeDiff > maxTimeDiff) {
    console.log(`  Time diff too large`)
    return false
  }

  const durationDiff = Math.abs(w1.durationSec - w2.durationSec)
  console.log(`  Duration Diff: ${durationDiff}s`)

  const isPauseHeavy =
    w1.type?.includes('Ski') ||
    w1.type?.includes('Snowboard') ||
    w1.type?.includes('Hike') ||
    w2.type?.includes('Ski') ||
    w2.type?.includes('Snowboard') ||
    w2.type?.includes('Hike')

  let maxDurationDiff = 5 * 60
  const tenPercent = Math.max(w1.durationSec, w2.durationSec) * 0.1
  maxDurationDiff = Math.max(maxDurationDiff, tenPercent)

  if (timeDiff < 10 * 60 * 1000) {
    if (isPauseHeavy) {
      maxDurationDiff = Math.max(60 * 60, Math.max(w1.durationSec, w2.durationSec) * 0.9)
    } else {
      maxDurationDiff = Math.max(30 * 60, Math.max(w1.durationSec, w2.durationSec) * 0.5)
    }
  }

  if (durationDiff > maxDurationDiff) {
    console.log(`  Duration diff too large`)
    return false
  }

  const titleSimilar =
    w1.title &&
    w2.title &&
    (w1.title.toLowerCase().includes(w2.title.toLowerCase()) ||
      w2.title.toLowerCase().includes(w1.title.toLowerCase()))

  console.log(`  Title Similar: ${titleSimilar} ('${w1.title}' vs '${w2.title}')`)

  const typeSimilar =
    w1.type &&
    w2.type &&
    (w1.type.toLowerCase() === w2.type.toLowerCase() ||
      (w1.type.toLowerCase().includes('ride') && w2.type.toLowerCase().includes('ride')) ||
      (w1.type.toLowerCase().includes('run') && w2.type.toLowerCase().includes('run')) ||
      (w1.type.toLowerCase() === 'gym' && w2.type.toLowerCase().includes('weight')) ||
      (w1.type.toLowerCase().includes('weight') && w2.type.toLowerCase() === 'gym'))

  console.log(`  Type Similar: ${typeSimilar} ('${w1.type}' vs '${w2.type}')`)

  const isDuplicate = titleSimilar || typeSimilar
  console.log(`  >> IS DUPLICATE: ${isDuplicate}`)

  return isDuplicate
}

async function main() {
  const ids = ['7f85cbdc-b95e-4d8a-83bc-b97898ca3376', '8f679573-1e60-420d-97e3-8a6c0ab88321']
  const workouts = await prisma.workout.findMany({
    where: { id: { in: ids } },
    orderBy: { date: 'desc' }
  })

  console.log(`Loaded ${workouts.length} workouts`)
  const groups = findDuplicateGroups(workouts)
  console.log(`Found ${groups.length} groups`)
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())
