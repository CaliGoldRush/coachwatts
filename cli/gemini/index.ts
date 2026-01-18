import { Command } from 'commander'
import { modelsCommand } from './models'
import { pricingCommand } from './pricing'
import deduplicateCommand from './deduplicate'

const geminiCommand = new Command('gemini').description('Gemini AI model and pricing management')

geminiCommand.addCommand(modelsCommand)
geminiCommand.addCommand(pricingCommand)
// Accidentally put it here in thought process, but better to make a new top-level 'workouts' command or add to 'debug'.
// 'debug' seems appropriate for now given the context.

export default geminiCommand
