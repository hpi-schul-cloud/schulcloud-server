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

@Module({
	imports: [
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: ENTITIES,
		}),
		MediaSourceSyncModule,
		LoggerModule,
		ConsoleWriterModule,
		ConsoleModule,
		ErrorModule,
	],
	providers: [MediaSyncConsole, MediaSourceSyncUc],
})
export class MediaSyncConsoleAppModule {}
