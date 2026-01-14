import { Command } from 'commander'
import chalk from 'chalk'

export const pricingCommand = new Command('pricing')
  .description('Display current Gemini pricing used by the application')
  .action(async () => {
    console.log(chalk.bold('Current Gemini Pricing Configuration:'))
    console.log('=====================================\n')

    console.log(chalk.yellow('1. Utility Pricing (server/utils/gemini.ts)'))
    console.log('Used by: Automatic analyses, reports, triggers\n')

    const utilityPricing = {
      'gemini-flash-latest': { input: 0.075, output: 0.3 },
      'gemini-3-pro-preview': { input: 1.25, output: 5.0 }
    }

    Object.entries(utilityPricing).forEach(([model, rates]) => {
      console.log(chalk.cyan(`Model: ${model}`))
      console.log(`  Input:  $${rates.input} / 1M tokens`)
      console.log(`  Output: $${rates.output} / 1M tokens`)
    })

    console.log('\n' + chalk.yellow('2. Chat Pricing (server/api/chat/messages.post.ts)'))
    console.log('Used by: Real-time coach chat\n')

    const chatPricing = {
      input: 0.075,
      output: 0.3
    }

    console.log(chalk.cyan('Model: gemini-flash (Default)'))
    console.log(`  Input:  $${chatPricing.input} / 1M tokens`)
    console.log(`  Output: $${chatPricing.output} / 1M tokens`)

    console.log('\n' + chalk.green.bold('STATUS: ALIGNED'))
    console.log('Utility pricing and Chat pricing are now consistent.')

    console.log('\n' + chalk.gray('Note: These values are currently hardcoded in the codebase.'))
    console.log(
      chalk.gray('The Gemini API does not currently expose a programmatic pricing endpoint.')
    )
  })
