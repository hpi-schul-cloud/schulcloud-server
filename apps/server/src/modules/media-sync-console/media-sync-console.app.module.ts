import { ErrorModule } from '@core/error';
import { LoggerModule } from '@core/logger';
import { ConsoleWriterModule } from '@infra/console';
import { MediaSourceSyncModule } from '@modules/media-source-sync';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { ConsoleModule } from 'nestjs-console';
import { MediaSyncConsole } from './api/media-sync-console';
import { mediaSyncConsoleConfig } from './media-sync-console.config';
import { ENTITIES } from './media-sync-console.entity.imports';
import { MediaSourceSyncUc } from './uc';
import { DatabaseModule, DATABASE_CONFIG_TOKEN, DatabaseConfig } from '@infra/database';

@Module({
	imports: [
		ConfigModule.forRoot(createConfigModuleOptions(mediaSyncConsoleConfig)),
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
