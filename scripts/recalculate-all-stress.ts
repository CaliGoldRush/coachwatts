/**
 * Trigger a global recalculation of training stress scores (CTL/ATL)
 * for all users, considering the current duplicate markings.
 * 
 * Usage: 
 *   Dev:  pnpm exec tsx scripts/recalculate-all-stress.ts
 *   Prod: pnpm exec tsx scripts/recalculate-all-stress.ts --prod
 */
import 'dotenv/config'

const useProd = process.argv.includes('--prod')

// Set the DATABASE_URL before importing prisma to ensure the singleton uses the correct one
if (useProd) {
  if (!process.env.DATABASE_URL_PROD) {
    console.error('❌ Error: DATABASE_URL_PROD is not set in your .env file.')
    process.exit(1)
  }
  process.env.DATABASE_URL = process.env.DATABASE_URL_PROD
  console.log('🚀 TARGET: PRODUCTION DATABASE')
} else {
  console.log('🛠️  TARGET: DEVELOPMENT DATABASE')
}

async function main() {
  // Use dynamic imports to ensure process.env.DATABASE_URL is set BEFORE prisma is initialized
  const { prisma } = await import('../server/utils/db')
  const { recalculateStressAfterDate } = await import('../server/utils/calculate-workout-stress')

  console.log('🚀 Starting global training stress recalculation...')
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL is not set in your .env file.')
    process.exit(1)
  }

  if (useProd) {
    console.log('⚠️  PROD SAFETY CHECK: Waiting 3 seconds... (Ctrl+C to abort)')
    await new Promise(resolve => setTimeout(resolve, 3000))
  }

  // Check connection
  try {
    console.log('📡 Connecting to database...')
    const users = await prisma.user.findMany({
      select: { id: true, email: true }
    })
    
    if (users.length === 0) {
      console.log('ℹ️ No users found in the database.')
      return
    }

    console.log(`✅ Found ${users.length} users. Starting recalculation chain...\n`)
    
    for (const user of users) {
      console.log(`👤 Processing user: ${user.email}`)
      
      // Find the earliest workout for this user to start recalculation from
      const earliestWorkout = await prisma.workout.findFirst({
        where: { userId: user.id },
        orderBy: { date: 'asc' },
        select: { date: true }
      })
      
      if (earliestWorkout) {
        console.log(`   📅 History starts at ${earliestWorkout.date.toISOString().split('T')[0]}`)
        console.log('   ⏳ Recalculating... (this may take a moment)')
        const count = await recalculateStressAfterDate(user.id, earliestWorkout.date)
        console.log(`   ✅ Success: Updated ${count} workouts.`)
      } else {
        console.log('   ℹ️ No workouts found for this user.')
      }
    }
    
    console.log('\n✨ Global recalculation complete. Your Fitness (CTL) and Form (TSB) data is now consistent.')
  } catch (error: any) {
    console.error('\n❌ Fatal error during recalculation:')
    console.error(`   ${error.message || error}`)
    if (error.message?.includes('password')) {
        console.error('\n   Tip: Check if your connection string contains special characters that might need encoding.')
    }
    process.exit(1)
  } finally {
    try {
        const { prisma } = await import('../server/utils/db')
        await (prisma as any).$disconnect()
    } catch (e) {}
  }
}

main()
