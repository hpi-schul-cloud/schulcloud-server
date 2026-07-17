import { ConsoleWriterModule } from '@infra/console';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { ErrorModule } from '@infra/error';
import { LoggerModule } from '@infra/logger';
import { Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { ConsoleModule } from 'nestjs-console';
import { LdapSyncConsole } from './api/ldap-sync.console';
import { LdapSyncUc } from './api/ldap-sync.uc';
import { ENTITIES, TEST_ENTITIES } from './ldap-sync.entity.imports';

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
			entities: TEST_ENTITIES,
		}),
	],
	providers,
})
export class LdapSyncConsoleAppTestModule {}
