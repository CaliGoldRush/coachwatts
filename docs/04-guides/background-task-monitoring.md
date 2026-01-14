# Background Task Monitoring Guide

Coach Watts uses a robust, real-time system for monitoring long-running background tasks (Trigger.dev jobs). This system replaces legacy client-side polling with a hybrid WebSocket + Server-Side Events approach.

## 🚀 Overview

The monitoring system consists of three layers:

1.  **Server-Side WebSocket (`server/api/websocket.ts`)**: Connects to Trigger.dev's real-time stream and forwards run updates to the client.
2.  **Global Client State (`app/composables/useUserRuns.ts`)**: A singleton composable that maintains the list of active runs, handles WebSocket connections, and merges updates intelligently.
3.  **UI Components**:
    - `DashboardTriggerMonitor`: A floating/collapsible widget that shows the status of all running tasks.
    - `TriggerMonitorButton`: A button in the navbar/sidebar that toggles the monitor and shows a badge count.

## 🛠️ How to Use

### 1. Triggering a Task

When you trigger a task from a component (e.g., "Generate Report"), you don't need to manually start polling. Instead, just trigger the API endpoint and refresh the global run list.

```typescript
// In your component (e.g., pages/recommendations/index.vue)
const { refresh: refreshUserRuns } = useUserRuns()

async function startTask() {
  try {
    const res = await $fetch('/api/my-task/trigger', { method: 'POST' })

    // Crucial: Refresh the global list immediately so the new run appears in the monitor
    refreshUserRuns()

    toast.add({ title: 'Task Started', color: 'info' })
  } catch (e) {
    // Handle error
  }
}
```

### 2. Reacting to Completion

To update your UI (e.g., refresh a list of recommendations) when a specific task finishes, use the `onTaskCompleted` helper. This listener is global and persistent—it works even if the user navigates away and comes back, or if the task was started in another tab.

```typescript
const { onTaskCompleted } = useUserRunsState()

// Listen for the specific task identifier (defined in your trigger/ file)
onTaskCompleted('generate-recommendations', async (run) => {
  // Optional: Add a small delay to ensure DB replication/consistency
  setTimeout(async () => {
    await refreshData() // Your local data fetch

    toast.add({
      title: 'Success',
      description: 'New data is ready!',
      color: 'success'
    })
  }, 1000)
})
```

### 3. Adding the Monitor to a Page

The `DashboardTriggerMonitor` is already included globally in `layouts/default.vue`, so it appears on all authenticated pages.

To add the **toggle button** to a specific page's navbar (like in the Dashboard or Recommendations page):

```vue
<template>
  <UDashboardNavbar>
    <template #right>
      <!-- Add the button here -->
      <DashboardTriggerMonitorButton />

      <!-- Other buttons... -->
    </template>
  </UDashboardNavbar>
</template>
```

## 🧩 Architecture Details

### Singleton Pattern

The `useUserRuns` composable uses a singleton pattern. The `runs` state and `WebSocket` connection are defined _outside_ the exported function. This ensures that:

- All components share the exact same list of runs.
- Only one WebSocket connection is open per client.
- The connection stays alive as you navigate between pages.

### Hybrid Reliability

The system is designed to be resilient:

1.  **WebSocket First**: Attempts to connect for real-time updates.
2.  **API Fallback**: `fetchActiveRuns` is called on mount to get the initial state.
3.  **Smart Merging**: If the API returns "EXECUTING" but the WebSocket has already pushed "COMPLETED", the local state preserves "COMPLETED". This prevents the UI from "flickering" back to a running state due to API latency.
4.  **Manual Refresh**: The monitor widget includes a refresh button that re-fetches the active run list from the API.

### Troubleshooting

- **Task not appearing?** Ensure you call `refreshUserRuns()` after the API call returns the `jobId`.
- **Status stuck?** Check the browser console for `[useUserRuns]` logs. The WebSocket might have disconnected. The system auto-reconnects, but a manual refresh might be needed in extreme network conditions.
- **Run ID vs Task Identifier**: `onTaskCompleted` listens for the `taskIdentifier` (e.g., `generate-weekly-report`), NOT the specific `runId` (e.g., `run_123`). This allows it to catch _any_ instance of that task completing.
