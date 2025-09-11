/* istanbul ignore file */
import { DeletionConsoleModule } from '@modules/deletion-console/deletion-console.app.module';
import { runConsoleApp } from './helpers/run-bootstrap-command';

void runConsoleApp(DeletionConsoleModule);
