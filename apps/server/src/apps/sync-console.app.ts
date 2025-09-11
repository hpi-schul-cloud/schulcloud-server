/* istanbul ignore file */
import { MediaSyncConsoleAppModule } from '@modules/media-sync-console/media-sync-console.app.module';
import { runConsoleApp } from './helpers/run-bootstrap-command';

void runConsoleApp(MediaSyncConsoleAppModule);
