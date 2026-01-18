import { prisma } from '../server/utils/db'

async function main() {
  const ids = ['7f85cbdc-b95e-4d8a-83bc-b97898ca3376', '8f679573-1e60-420d-97e3-8a6c0ab88321']
  const workouts = await prisma.workout.findMany({
    where: { id: { in: ids } }
  })

  workouts.forEach((w) => {
    console.log('------------------------------------------------')
    console.log(`ID: ${w.id}`)
    console.log(`User ID: ${w.userId}`)
    console.log(`Title: ${w.title}`)
    console.log(`Type: ${w.type}`)
    console.log(`Date: ${w.date.toISOString()}`)
    console.log(`Duration: ${w.durationSec}s`)
    console.log(`Source: ${w.source}`)
    console.log(`isDuplicate: ${w.isDuplicate}`)
    console.log(`duplicateOf: ${w.duplicateOf}`)
  })
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())
