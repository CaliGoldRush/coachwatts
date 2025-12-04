<template>
  <div>
    <!-- Hero Section -->
    <LandingPageHero 
      title="Train Smarter, Not Harder"
      highlight="With AI"
      description="Coach Watts analyzes your data from Intervals.icu, Whoop, and more to provide daily actionable training advice tailored to your recovery and goals."
      pill="New: Integration with Whoop 4.0"
    >
      <template #actions>
        <UButton size="xl" to="/login" icon="i-heroicons-rocket-launch">Start Training Now</UButton>
        <UButton size="xl" variant="outline" to="#features" icon="i-heroicons-arrow-down">Learn More</UButton>
      </template>

      <template #image>
        <div class="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl bg-gray-900/5 aspect-video flex items-center justify-center relative group">
          <!-- Placeholder for dashboard screenshot -->
          <div class="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
             <div class="text-center p-8">
                <UIcon name="i-lucide-layout-dashboard" class="w-16 h-16 mb-4 mx-auto opacity-50" />
                <p class="font-medium">Dashboard Preview</p>
             </div>
          </div>
          <!-- Simulated UI Elements overlay -->
          <div class="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
             <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                   <UIcon name="i-heroicons-check" class="w-6 h-6 text-green-600" />
                </div>
                <div>
                   <h4 class="font-bold text-sm">Ready to Train</h4>
                   <p class="text-xs text-gray-500">Your recovery is high. Suggested: VO2 Max Intervals</p>
                </div>
             </div>
          </div>
        </div>
      </template>
    </LandingPageHero>

    <!-- Features Section -->
    <LandingPageSection id="features" title="Everything you need to perform" description="Comprehensive tools to analyze, plan, and execute your training.">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <UCard v-for="feature in features" :key="feature.title" class="hover:ring-2 hover:ring-primary/50 transition-all">
          <template #header>
            <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <UIcon :name="feature.icon" class="w-6 h-6 text-primary" />
            </div>
            <h3 class="text-xl font-bold mb-2">{{ feature.title }}</h3>
          </template>
          <p class="text-gray-600 dark:text-gray-300">{{ feature.description }}</p>
        </UCard>
      </div>
    </LandingPageSection>

    <!-- Integrations Section -->
    <LandingPageSection title="Works with your favorite tools" alternate>
      <div class="flex flex-wrap justify-center gap-8 md:gap-16 opacity-75 grayscale hover:grayscale-0 transition-all duration-500">
         <div class="flex items-center gap-2 font-bold text-2xl"><UIcon name="i-lucide-activity" class="text-orange-500" /> Strava</div>
         <div class="flex items-center gap-2 font-bold text-2xl"><UIcon name="i-lucide-activity" class="text-blue-500" /> Intervals.icu</div>
         <div class="flex items-center gap-2 font-bold text-2xl"><UIcon name="i-lucide-watch" class="text-blue-600" /> Garmin</div>
         <div class="flex items-center gap-2 font-bold text-2xl"><UIcon name="i-lucide-watch" class="text-gray-500" /> Whoop</div>
      </div>
    </LandingPageSection>

    <!-- Pricing Section -->
    <LandingPageSection id="pricing" title="Simple Pricing" description="Start for free, upgrade for advanced AI insights.">
      <LandingPricingPlans :plans="plans" />
    </LandingPageSection>

    <!-- CTA Section -->
    <LandingPageSection class="!py-0">
      <div class="bg-primary/5 dark:bg-primary/10 rounded-3xl p-8 md:p-16 text-center my-16">
        <h2 class="text-3xl font-bold mb-4">Ready to reach your peak?</h2>
        <p class="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-xl mx-auto">
          Join hundreds of athletes using Coach Watts to train smarter every day.
        </p>
        <UButton size="xl" to="/login" color="primary">Get Started for Free</UButton>
      </div>
    </LandingPageSection>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'home',
  auth: false // Disable auth middleware for this page
})

const features = [
  {
    title: 'AI Daily Coach',
    description: 'Get daily workout recommendations based on your sleep, HRV, and recent training load.',
    icon: 'i-heroicons-sparkles'
  },
  {
    title: 'Performance Analytics',
    description: 'Deep dive into your power curve, fatigue resistance, and training trends.',
    icon: 'i-heroicons-chart-bar'
  },
  {
    title: 'Smart Scheduling',
    description: 'Adaptive training plans that adjust automatically when you miss a workout.',
    icon: 'i-heroicons-calendar'
  }
]

const plans = [
  {
    name: 'Starter',
    price: '$0',
    description: 'Perfect for getting started with structured training.',
    features: ['Basic Analytics', 'Manual Workout Planning', 'Connect 1 Device', 'Community Support'],
    cta: 'Start Free'
  },
  {
    name: 'Pro Athlete',
    price: '$12',
    description: 'Advanced AI insights for serious performance.',
    features: ['AI Daily Recommendations', 'Advanced Performance Metrics', 'Unlimited Device Sync', 'Priority Support', 'Training Plan Builder'],
    popular: true,
    cta: 'Start Trial'
  },
  {
    name: 'Team',
    price: '$49',
    description: 'For coaches and teams managing multiple athletes.',
    features: ['Manage 5 Athletes', 'Team Dashboard', 'Compliance Reports', 'Custom Branding'],
    cta: 'Contact Sales'
  }
]
</script>
