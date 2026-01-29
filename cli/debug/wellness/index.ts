import { Command } from 'commander'
import inspectCommand from './inspect'
import candidatesCommand from './candidates'
import sourceCommand from './source'
import keysCommand from './keys'

const wellnessCommand = new Command('wellness').description('Wellness data debugging tools')

wellnessCommand.addCommand(inspectCommand)
wellnessCommand.addCommand(candidatesCommand)
wellnessCommand.addCommand(sourceCommand)
wellnessCommand.addCommand(keysCommand)

export default wellnessCommand
