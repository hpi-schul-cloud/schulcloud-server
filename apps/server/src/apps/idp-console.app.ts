/* istanbul ignore file */
import { IdpConsoleModule } from '@modules/idp-console/idp-console.app.module';
import { runBootstrapCommand } from './helpers/run-bootstrap-command';

void runBootstrapCommand(IdpConsoleModule);
