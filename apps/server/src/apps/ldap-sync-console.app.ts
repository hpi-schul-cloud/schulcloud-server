/* istanbul ignore file */
import { LdapSyncConsoleAppModule } from '@modules/ldap-sync-console/ldap-sync-console.app.module';
import { runConsoleApp } from './helpers/run-console-app';

void runConsoleApp(LdapSyncConsoleAppModule);
