/* istanbul ignore file */
import { MediaSyncConsoleAppModule } from '@modules/media-sync-console/media-sync-console.app.module';
import { runBootstrapCommand } from './helpers/run-bootstrap-command';

void runBootstrapCommand(MediaSyncConsoleAppModule);
