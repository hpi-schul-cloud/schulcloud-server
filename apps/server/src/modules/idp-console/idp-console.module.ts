import { Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';
import { CqrsModule } from '@nestjs/cqrs';
import { ConsoleWriterModule } from '@infra/console';
import { ConfigModule } from '@nestjs/config';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Logger, LoggerModule } from '@src/core/logger';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { SchulconnexRestClient } from '@infra/schulconnex-client';
import { AccountModule } from '@modules/account';
import { OauthAdapterService } from '@modules/oauth';
import { defaultMikroOrmOptions } from '@modules/server';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { UserService } from '@modules/user';
import { UserRepo } from '@shared/repo';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { RoleModule } from '@modules/role';
import { IdentityManagementModule } from '@infra/identity-management';
import { RegistrationPinModule } from '@modules/registration-pin';
import {
	SynchronizationEntity,
	SynchronizationModule,
	SynchronizationRepo,
	SynchronizationService,
	SynchronizationUc,
} from '@modules/synchronization';
import { IdpSyncConsole } from './idp-sync-console';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		ConsoleModule,
		ConsoleWriterModule,
		LoggerModule,
		CqrsModule,
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
		IdentityManagementModule,
		HttpModule,
		AccountModule,
		RegistrationPinModule,
		RoleModule,
		SynchronizationModule,
	],
	providers: [
		SynchronizationUc,
		OauthAdapterService,
		IdpSyncConsole,
		UserDORepo,
		UserRepo,
		UserService,
		{
			provide: SchulconnexRestClient,
			useFactory: (httpService: HttpService, oauthAdapterService: OauthAdapterService, logger: Logger) =>
				new SchulconnexRestClient(
					{
						apiUrl: Configuration.get('SCHULCONNEX_CLIENT__API_URL') as string,
						tokenEndpoint: Configuration.get('SCHULCONNEX_CLIENT__TOKEN_ENDPOINT') as string,
						clientId: Configuration.get('SCHULCONNEX_CLIENT__CLIENT_ID') as string,
						clientSecret: Configuration.get('SCHULCONNEX_CLIENT__CLIENT_SECRET') as string,
						personenInfoTimeoutInMs: Configuration.get('SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS') as number,
					},
					httpService,
					oauthAdapterService,
					logger
				),
			inject: [HttpService, OauthAdapterService, Logger],
		},
	],
})
export class IdpConsoleModule {}
