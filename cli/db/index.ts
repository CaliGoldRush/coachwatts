import { Command } from 'commander'
import backupCommand from './backup'
import compareCommand from './compare'
import migrateZonesCommand from './migrate-zones'

const dbCommand = new Command('db').description('Database commands')

dbCommand.addCommand(backupCommand)
dbCommand.addCommand(compareCommand)
dbCommand.addCommand(migrateZonesCommand)

export default dbCommand
