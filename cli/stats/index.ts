import { Command } from 'commander'
import usersStatsCommand from './users'
import webhookStatsCommand from './webhook'
import whoopStatsCommand from './whoop'

const statsCommand = new Command('stats').description('Statistics commands')

statsCommand.addCommand(usersStatsCommand)
statsCommand.addCommand(webhookStatsCommand)
statsCommand.addCommand(whoopStatsCommand)

export default statsCommand
