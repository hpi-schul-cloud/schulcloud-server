import { ErrorModule } from '@core/error';
import { LoggerModule } from '@core/logger';
import { ConsoleWriterModule } from '@infra/console';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { MediaSourceSyncModule } from '@modules/media-source-sync';
import { Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';
import { MediaSyncConsole } from './api/media-sync-console';
import { ENTITIES } from './media-sync-console.entity.imports';
import { MediaSourceSyncUc } from './uc';
import { MongoMemoryDatabaseModule } from '@testing/database';

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
			entities: ENTITIES,
		}),
	],
	providers,
})
export class MediaSyncConsoleAppTestModule {}
