/* istanbul ignore file */
import { bootstrap } from './bootstrap';
import { ManagementModule } from './modules/management/management.module';

// start management api
void bootstrap(ManagementModule, 3333);
