import { ErrorModule } from '@core/error';
import { LoggerModule } from '@core/logger';
import { ConsoleWriterModule } from '@infra/console';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';
import { LdapSyncConsole } from './api/ldap-sync.console';
import { LdapSyncUc } from './api/ldap-sync.uc';
import { ENTITIES } from './ldap-sync.entity.imports';

@Module({
	imports: [
		LoggerModule,
		ErrorModule,
		ConsoleWriterModule,
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: ENTITIES,
		}),
		ConsoleModule,
	],
	providers: [LdapSyncConsole, LdapSyncUc],
})
export class LdapSyncConsoleAppModule {}
