import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const id = '8dd7fcef-6dc1-4334-8938-8ab33f57755a'
  const workout = await prisma.plannedWorkout.findUnique({
    where: { id }
  })
  console.log(JSON.stringify(workout, null, 2))
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())
