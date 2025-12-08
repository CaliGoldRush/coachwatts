<template>
  <div id="features" class="bg-gray-50 dark:bg-gray-900 py-24 sm:py-32">
    <div class="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
      <h2 class="text-base font-semibold leading-7 text-primary-600 dark:text-primary-400 font-mono">CAPABILITIES</h2>
      <p class="mt-2 max-w-lg text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
        Everything you need to train like a pro.
      </p>
      
      <div class="mt-10 grid grid-cols-1 gap-4 sm:mt-16 lg:grid-cols-6 lg:grid-rows-2">
        
        <!-- Feature 1: The Big Card (Daily Plans) -->
        <div class="relative lg:col-span-3 lg:row-span-2">
          <div class="absolute inset-px rounded-lg bg-white dark:bg-gray-800 max-lg:rounded-t-[2rem] lg:rounded-l-[2rem]"></div>
          <div class="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)] lg:rounded-l-[calc(2rem+1px)]">
            <div class="px-8 pb-3 pt-8 sm:px-10 sm:pb-0 sm:pt-10">
              <p class="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white max-lg:text-center">Dynamic Daily Plans</p>
              <p class="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400 max-lg:text-center">
                Plans that adapt to your sleep score. If you slept 4 hours, we won't ask for a VO2 Max session.
              </p>
            </div>
            <div class="relative min-h-[30rem] w-full grow [container-type:inline-size] max-lg:mx-auto max-lg:max-w-sm">
              <div class="absolute inset-x-10 bottom-0 top-10 overflow-hidden rounded-t-xl bg-gray-900 shadow-2xl">
                 <!-- Mock UI: Daily Plan -->
                 <div class="p-4 space-y-3">
                    <div class="flex items-center justify-between text-xs text-gray-400 border-b border-gray-800 pb-2">
                       <span>TODAY'S PLAN</span>
                       <span class="text-yellow-500">ADAPTED (POOR SLEEP)</span>
                    </div>
                    <div class="p-3 bg-gray-800 rounded border-l-4 border-green-500">
                       <div class="text-white font-bold">Endurance Ride (Z2)</div>
                       <div class="text-xs text-gray-400">1h 30m • 140-160W</div>
                    </div>
                    <div class="p-3 bg-gray-800/50 rounded border-l-4 border-gray-700 opacity-50">
                       <div class="text-gray-400 line-through">VO2 Max Intervals</div>
                       <div class="text-xs text-gray-500">Cancelled due to recovery</div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
          <div class="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 dark:ring-white/10 max-lg:rounded-t-[2rem] lg:rounded-l-[2rem]"></div>
        </div>

        <!-- Feature 2: Race Strategy -->
        <div class="relative lg:col-span-3">
          <div class="absolute inset-px rounded-lg bg-white dark:bg-gray-800 lg:rounded-tr-[2rem]"></div>
          <div class="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-tr-[calc(2rem+1px)]">
            <div class="px-8 pb-3 pt-8 sm:px-10 sm:pb-0 sm:pt-10">
              <p class="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white max-lg:text-center">Race Strategy Intelligence</p>
              <p class="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400 max-lg:text-center">
                Upload a GPX file. We analyze the terrain and your power curve to tell you exactly how to pace it.
              </p>
            </div>
            <div class="flex flex-1 items-center justify-center px-8 max-lg:pb-12 max-lg:pt-10 sm:px-10 lg:pb-2">
               <div class="w-full h-16 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full blur-xl opacity-20 absolute"></div>
               <UIcon name="i-heroicons-map" class="w-24 h-24 text-primary-500 relative z-10" />
            </div>
          </div>
          <div class="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 dark:ring-white/10 lg:rounded-tr-[2rem]"></div>
        </div>

        <!-- Feature 3: Nutrition -->
        <div class="relative lg:col-span-2">
          <div class="absolute inset-px rounded-lg bg-white dark:bg-gray-800 lg:rounded-bl-[2rem]"></div>
          <div class="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-bl-[calc(2rem+1px)]">
            <div class="px-8 pb-3 pt-8 sm:px-10 sm:pb-0 sm:pt-10">
              <p class="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white max-lg:text-center">Nutrition Sync</p>
              <p class="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400 max-lg:text-center">
                Connect Yazio or MyFitnessPal to align fueling with burning.
              </p>
            </div>
            <div class="flex flex-1 items-center justify-center px-8 max-lg:pb-12 max-lg:pt-10 sm:px-10 lg:pb-2">
               <UIcon name="i-heroicons-cake" class="w-16 h-16 text-pink-400" />
            </div>
          </div>
          <div class="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 dark:ring-white/10 lg:rounded-bl-[2rem]"></div>
        </div>

        <!-- Feature 4: Chat -->
        <div class="relative lg:col-span-1">
          <div class="absolute inset-px rounded-lg bg-white dark:bg-gray-800 lg:rounded-br-[2rem]"></div>
          <div class="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-br-[calc(2rem+1px)]">
            <div class="px-8 pb-3 pt-8 sm:px-10 sm:pb-0 sm:pt-10">
              <p class="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white max-lg:text-center">Chat</p>
              <p class="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400 max-lg:text-center">
                Ask anything.
              </p>
            </div>
            <div class="flex flex-1 items-center justify-center px-8 max-lg:pb-12 max-lg:pt-10 sm:px-10 lg:pb-2">
               <UIcon name="i-heroicons-chat-bubble-left-right" class="w-12 h-12 text-blue-400" />
            </div>
          </div>
          <div class="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 dark:ring-white/10 lg:rounded-br-[2rem]"></div>
        </div>
      </div>
    </div>
  </div>
</template>