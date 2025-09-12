/* istanbul ignore file */
/* eslint-disable promise/always-return */
import { ManagementConsoleModule } from '@modules/management/management-console.app.module';
import { runConsoleApp } from './helpers/run-console-app';

/**
 * The console is starting the application wrapped into commander.
 * This allows adding console commands to execute provider methods.
 */
void runConsoleApp(ManagementConsoleModule);
