/* istanbul ignore file */
import { IdpConsoleModule } from '@modules/idp-console/idp-console.app.module';
import { runConsoleApp } from './helpers/run-bootstrap-command';

void runConsoleApp(IdpConsoleModule);
