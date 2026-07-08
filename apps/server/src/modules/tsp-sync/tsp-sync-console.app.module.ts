import { ConsoleWriterModule } from '@infra/console';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { ErrorModule } from '@infra/error';
import { LoggerModule } from '@infra/logger';
import { ENTITIES } from '@modules/management/management.entity.imports';
import { Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { ConsoleModule } from 'nestjs-console';
import { TspSyncModule } from './tsp-sync.module';

const imports = [LoggerModule, ErrorModule, ConsoleWriterModule, ConsoleModule, TspSyncModule];

@Module({
	imports: [
		...imports,
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: ENTITIES,
		}),
	],
})
export class TspSyncConsoleAppModule {}

@Module({
	imports: [
		...imports,
		MongoMemoryDatabaseModule.forRoot({
			entities: ENTITIES,
		}),
	],
})
export class TspSyncConsoleAppTestModule {}
