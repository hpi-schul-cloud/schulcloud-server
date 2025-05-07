import { LoggerModule } from '@core/logger';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { ConsoleWriterModule } from '@infra/console';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MediaSourceSyncModule } from '@modules/media-source-sync';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { ConsoleModule } from 'nestjs-console';
import { MediaSyncConsole } from './api/media-sync-console';
import { mediaSyncConsoleConfig } from './media-sync-console.config';
import { ENTITIES } from './media-sync-console.entity.imports';
import { MediaMetadataSyncUc } from './uc';

@Module({
	imports: [
		ConfigModule.forRoot(createConfigModuleOptions(mediaSyncConsoleConfig)),
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			allowGlobalContext: true,
			entities: ENTITIES,
			// debug: true, // use it for locally debugging of queries
		}),
		MediaSourceSyncModule,
		LoggerModule,
		RabbitMQWrapperModule,
		ConsoleWriterModule,
		ConsoleModule,
	],
	providers: [MediaSyncConsole, MediaMetadataSyncUc],
})
export class MediaSyncConsoleAppModule {}
