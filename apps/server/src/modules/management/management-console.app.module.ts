import { ConsoleWriterModule } from '@infra/console/console-writer/console-writer.module';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { SyncModule } from '@infra/sync/sync.module';
import { FilesModule } from '@modules/files';
import { ManagementModule } from '@modules/management/management.module';
import { Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { ConsoleModule } from 'nestjs-console';
import { ENTITIES } from './management.entity.imports';
import migrationOptions from './migrations-options';

const imports = [ManagementModule, ConsoleModule, ConsoleWriterModule, FilesModule, SyncModule];

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
