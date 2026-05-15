import { ErrorModule } from '@core/error';
import { LoggerModule } from '@core/logger';
import { ConsoleWriterModule } from '@infra/console';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { ConsoleModule } from 'nestjs-console';
import { LdapSyncConsole } from './api/ldap-sync.console';
import { LdapSyncUc } from './api/ldap-sync.uc';
import { ENTITIES } from './ldap-sync.entity.imports';

const imports = [LoggerModule, ErrorModule, ConsoleWriterModule, ConsoleModule];
const providers = [LdapSyncConsole, LdapSyncUc];
@Module({
	imports: [
		...imports,
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: ENTITIES,
		}),
	],
	providers,
})
export class LdapSyncConsoleAppModule {}

@Module({
	imports: [
		...imports,
		MongoMemoryDatabaseModule.forRoot({
			entities: ENTITIES,
		}),
	],
	providers,
})
export class LdapSyncConsoleAppTestModule {}
