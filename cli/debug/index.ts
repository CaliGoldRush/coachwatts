import { Command } from 'commander'
import webhookCommand from './webhook'
import profileCommand from './profile'
import workoutCommand from './workout'
import userStatsCommand from './user-stats'
import llmRequestCommand from './llm-request'
import athleteCommand from './athlete'
import trainingLoadCommand from './training-load'
import debugWellnessCommand from './wellness'
import recommendationsCommand from './recommendations'
import analyzeStreamsCommand from './analyze-streams'
import findAnyCommand from './find-any'
import plannedCommand from './planned'

const debugCommand = new Command('debug')

debugCommand
  .description('Debugging utilities')
  .addCommand(webhookCommand)
  .addCommand(profileCommand)
  .addCommand(workoutCommand)
  .addCommand(userStatsCommand)
  .addCommand(llmRequestCommand)
  .addCommand(athleteCommand)
  .addCommand(trainingLoadCommand)
  .addCommand(debugWellnessCommand)
  .addCommand(recommendationsCommand)
  .addCommand(analyzeStreamsCommand)
  .addCommand(findAnyCommand)
  .addCommand(plannedCommand)

export default debugCommand
