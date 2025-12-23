
import { Command } from 'commander';
import authLogicCommand from './auth-logic';

const debugCommand = new Command('debug')
    .description('Debug commands');

debugCommand.addCommand(authLogicCommand);

export default debugCommand;
