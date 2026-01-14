import { Command } from 'commander'
import chalk from 'chalk'

const apiKey = process.env.GEMINI_API_KEY

export const modelsCommand = new Command('models')
  .description('List available Gemini models from the API')
  .action(async () => {
    if (!apiKey) {
      console.error(chalk.red('GEMINI_API_KEY not found in environment variables'))
      process.exit(1)
    }

    try {
      console.log(chalk.blue('Fetching available Gemini models...\n'))

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const models = data.models || []

      console.log(chalk.bold('Available Models:'))
      console.log('=================\n')

      for (const model of models) {
        const modelId = model.name.replace('models/', '')
        console.log(chalk.cyan(`✓ ${modelId}`))
        if (model.displayName) console.log(`  Display Name: ${model.displayName}`)
        if (model.description)
          console.log(`  Description: ${model.description.substring(0, 100)}...`)
        console.log(`  Limits: Input ${model.inputTokenLimit}, Output ${model.outputTokenLimit}`)
        console.log('---')
      }
    } catch (error) {
      console.error(chalk.red('Error listing models:'), error)
      process.exit(1)
    }
  })
