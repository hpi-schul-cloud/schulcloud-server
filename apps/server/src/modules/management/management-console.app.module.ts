import { ConsoleWriterModule } from '@infra/console/console-writer/console-writer.module';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { FilesConsoleModule } from '@modules/files';
import { ManagementModule } from '@modules/management/management.module';
import { TspSyncModule } from '@modules/tsp-sync';
import { Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { ConsoleModule } from 'nestjs-console';
import { ENTITIES } from './management.entity.imports';
import migrationOptions from './migrations-options';

const imports = [ManagementModule, ConsoleModule, ConsoleWriterModule, FilesConsoleModule, TspSyncModule];

@Module({
	imports: [
		...imports,
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: ENTITIES,
			migrationOptions,
		}),
	],
	providers: [],
})
export class ManagementConsoleModule {}

@Module({
	imports: [
		...imports,
		MongoMemoryDatabaseModule.forRoot({
			entities: ENTITIES,
		}),
	],
	providers: [],
})
export class ManagementConsoleTestModule {}
