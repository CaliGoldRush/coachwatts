import { prisma } from '../server/utils/db'
import { tasks } from '@trigger.dev/sdk/v3'

async function main() {
  console.log('Fetching users...')
  const users = await prisma.user.findMany({
    select: { id: true, email: true }
  })

  console.log(`Found ${users.length} users. Triggering generation...`)

  for (const user of users) {
    console.log(`Triggering for ${user.email}...`)
    try {
      await tasks.trigger('generate-score-explanations', { userId: user.id, force: true })
      console.log(`✅ Triggered for ${user.email}`)
    } catch (e) {
      console.error(`❌ Failed for ${user.email}:`, e)
    }
  }

  console.log('Done! Recommendations will appear in a few minutes.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
