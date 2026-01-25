import { Command } from 'commander'
import devCommand from './dev'

const telegramCommand = new Command('telegram').description('Telegram bot management commands')

telegramCommand.addCommand(devCommand)

export default telegramCommand
