import { ConsoleWriterModule } from '@infra/console';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { SchulconnexClientModule } from '@infra/schulconnex-client';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defaultMikroOrmOptions } from '@modules/server';
import { SynchronizationEntity, SynchronizationModule } from '@modules/synchronization';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { LoggerModule } from '@src/core/logger';
import { ConsoleModule } from 'nestjs-console';
import { IdpSyncConsole } from './idp-sync-console';
import { SynchronizationUc } from './uc';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		SchulconnexClientModule.registerAsync(),
		SynchronizationModule,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			allowGlobalContext: true,
			entities: [...ALL_ENTITIES, SynchronizationEntity],
			debug: true,
		}),
		UserModule,
		LoggerModule,
		RabbitMQWrapperModule,
		ConsoleWriterModule,
		ConsoleModule,
	],
	providers: [SynchronizationUc, IdpSyncConsole],
})
export class IdpConsoleModule {}
