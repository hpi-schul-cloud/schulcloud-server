import { ConsoleWriterModule } from '@infra/console';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { ErrorModule } from '@infra/error';
import { LoggerModule } from '@infra/logger';
import { MediaSourceSyncModule } from '@modules/media-source-sync';
import { Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { ConsoleModule } from 'nestjs-console';
import { MediaSyncConsole } from './api/media-sync-console';
import { ENTITIES, TEST_ENTITIES } from './media-sync-console.entity.imports';
import { MediaSourceSyncUc } from './uc';

const imports = [MediaSourceSyncModule, LoggerModule, ConsoleWriterModule, ConsoleModule, ErrorModule];

const providers = [MediaSyncConsole, MediaSourceSyncUc];

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
export class MediaSyncConsoleAppModule {}

@Module({
	imports: [
		...imports,
		MongoMemoryDatabaseModule.forRoot({
			entities: TEST_ENTITIES,
		}),
	],
	providers,
})
export class MediaSyncConsoleAppTestModule {}
