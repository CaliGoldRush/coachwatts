import { tasks } from '@trigger.dev/sdk/v3'
import * as Sentry from '@sentry/node'

// Initialize Sentry
Sentry.init({
  defaultIntegrations: false,
  // The Data Source Name (DSN) is a unique identifier for your Sentry project.
  dsn: process.env.SENTRY_DSN,
  // Update this to match the environment you want to track errors for
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
})

// Register a global onFailure hook to capture errors
tasks.onFailure(({ payload, error, ctx }) => {
  Sentry.captureException(error, {
    extra: {
      payload,
      ctx
    }
  })
})
