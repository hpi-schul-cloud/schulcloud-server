/* istanbul ignore file */
import { bootstrap } from './bootstrap';
import { ServerModule } from './server.module';

// start default application
console.log('######################################################################');
console.log('#####   start server module on port 3030                         #####');
console.log('######################################################################');
void bootstrap(ServerModule, 3030);
