/* istanbul ignore file */
import { bootstrap } from './bootstrap';
import { ServerModule } from './server.module';

// start default application
void bootstrap(ServerModule, 3030);
