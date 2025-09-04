/* istanbul ignore file */
/* eslint-disable promise/always-return */
import { ManagementConsoleModule } from '@modules/management/management-console.app.module';
import { runBootstrapCommand } from './helpers/run-bootstrap-command';

/**
 * The console is starting the application wrapped into commander.
 * This allows adding console commands to execute provider methods.
 */
void runBootstrapCommand(ManagementConsoleModule);
