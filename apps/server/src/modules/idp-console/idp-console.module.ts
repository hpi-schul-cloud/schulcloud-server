import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { SchulconnexClientModule } from '@infra/schulconnex-client';
import { SynchronizationEntity, SynchronizationModule } from '@modules/synchronization';
import { defaultMikroOrmOptions } from '@modules/server';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UserModule } from '@modules/user';
import { LoggerModule } from '@src/core/logger';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { ConsoleWriterModule } from '@infra/console';
import { ConsoleModule } from 'nestjs-console';
import { SynchronizationUc } from './uc';
import { IdpSyncConsole } from './idp-sync-console';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		SchulconnexClientModule.register({
			apiUrl: Configuration.get('SCHULCONNEX_CLIENT__API_URL') as string,
			tokenEndpoint: Configuration.get('SCHULCONNEX_CLIENT__TOKEN_ENDPOINT') as string,
			clientId: Configuration.get('SCHULCONNEX_CLIENT__CLIENT_ID') as string,
			clientSecret: Configuration.get('SCHULCONNEX_CLIENT__CLIENT_SECRET') as string,
			personenInfoTimeoutInMs: Configuration.get('SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS') as number,
		}),
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
