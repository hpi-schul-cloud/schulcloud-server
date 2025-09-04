/* istanbul ignore file */
import { DeletionConsoleModule } from '@modules/deletion-console/deletion-console.app.module';
import { runBootstrapCommand } from './helpers/run-bootstrap-command';

void runBootstrapCommand(DeletionConsoleModule);
