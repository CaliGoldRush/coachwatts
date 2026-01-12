<script setup lang="ts">
  import { Line } from 'vue-chartjs'
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Filler,
    type ChartOptions
  } from 'chart.js'

  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Filler
  )

  const props = defineProps<{
    data: {
      today: number[]
      average: number[]
    }
  }>()

  const chartData = computed(() => {
    const labels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)

    return {
      labels,
      datasets: [
        {
          label: 'Today',
          borderColor: '#3b82f6', // blue-500
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          data: props.data.today,
          fill: true,
          tension: 0.4
        },
        {
          label: '3-Day Average',
          borderColor: '#9ca3af', // gray-400
          backgroundColor: 'transparent',
          data: props.data.average,
          borderDash: [5, 5],
          tension: 0.4,
          pointRadius: 0
        }
      ]
    }
  })

  const chartOptions = computed<ChartOptions<'line'>>(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom' as const
        }
      }
    }
  })
</script>

<template>
  <div class="h-64">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
