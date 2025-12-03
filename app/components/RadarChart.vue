<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    <div v-if="!hasScores" class="text-center py-12 text-gray-500">
      No score data available
    </div>
    
    <div v-else class="flex justify-center">
      <div class="w-full max-w-md">
        <Radar :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Radar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

const props = defineProps<{
  scores: Record<string, number | null | undefined>
  type: 'workout' | 'nutrition'
}>()

const colorMode = useColorMode()

const labels = computed(() => {
  if (props.type === 'workout') {
    return ['Overall', 'Technical', 'Effort', 'Pacing', 'Execution']
  } else {
    return ['Overall', 'Macro Balance', 'Quality', 'Adherence', 'Hydration']
  }
})

const scoreKeys = computed(() => {
  if (props.type === 'workout') {
    return ['overall', 'technical', 'effort', 'pacing', 'execution']
  } else {
    return ['overall', 'macroBalance', 'quality', 'adherence', 'hydration']
  }
})

const chartColor = computed(() => props.type === 'workout' ? 'rgb(59, 130, 246)' : 'rgb(34, 197, 94)')

const hasScores = computed(() => {
  return Object.values(props.scores).some(score => score != null && score !== undefined)
})

const chartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: props.type === 'workout' ? 'Workout Scores' : 'Nutrition Scores',
      data: scoreKeys.value.map(key => props.scores[key] || 0),
      backgroundColor: props.type === 'workout' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(34, 197, 94, 0.2)',
      borderColor: chartColor.value,
      borderWidth: 2,
      pointBackgroundColor: chartColor.value,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: chartColor.value,
      pointRadius: 5,
      pointHoverRadius: 7
    }
  ]
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          return `${context.label}: ${context.parsed.r.toFixed(1)}/10`
        }
      }
    }
  },
  scales: {
    r: {
      min: 0,
      max: 10,
      ticks: {
        stepSize: 2,
        color: colorMode.value === 'dark' ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)',
        backdropColor: 'transparent',
        font: {
          size: 11
        }
      },
      grid: {
        color: colorMode.value === 'dark' ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)'
      },
      pointLabels: {
        color: colorMode.value === 'dark' ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)',
        font: {
          size: 13,
          weight: 500 as any
        }
      },
      angleLines: {
        color: colorMode.value === 'dark' ? 'rgba(75, 85, 99, 0.2)' : 'rgba(209, 213, 219, 0.4)'
      }
    }
  }
}))
</script>