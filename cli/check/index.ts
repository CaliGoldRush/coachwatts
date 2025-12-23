
import { Command } from 'commander';
import dbSchemaCommand from './db-schema';

const checkCommand = new Command('check')
    .description('Check commands');

checkCommand.addCommand(dbSchemaCommand);

export default checkCommand;
