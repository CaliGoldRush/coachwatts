
import { Command } from 'commander';
import authLogicCommand from './auth-logic';
import troubleshootWorkoutsCommand from './workout';

const debugCommand = new Command('debug')
    .description('Debug commands');

debugCommand.addCommand(authLogicCommand);
debugCommand.addCommand(troubleshootWorkoutsCommand);

export default debugCommand;
