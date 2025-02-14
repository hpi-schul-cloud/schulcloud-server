import { OauthAdapterService } from '@modules/oauth-adapter';
import { HttpModule, HttpService } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger, LoggerModule } from '@core/logger';
import { SchulconnexRestClient } from './schulconnex-rest-client';
import { SchulconnexRestClientOptions } from './schulconnex-rest-client-options';

@Module({})
export class SchulconnexClientModule {
	public static registerAsync(): DynamicModule {
		return {
			imports: [HttpModule, LoggerModule],
			module: SchulconnexClientModule,
			providers: [
				OauthAdapterService,
				{
					provide: SchulconnexRestClient,
					useFactory: (
						httpService: HttpService,
						oauthAdapterService: OauthAdapterService,
						logger: Logger,
						configService: ConfigService
					) => {
						const options: SchulconnexRestClientOptions = {
							apiUrl: configService.get<string>('SCHULCONNEX_CLIENT__API_URL'),
							tokenEndpoint: configService.get<string>('SCHULCONNEX_CLIENT__TOKEN_ENDPOINT'),
							clientId: configService.get<string>('SCHULCONNEX_CLIENT__CLIENT_ID'),
							clientSecret: configService.get<string>('SCHULCONNEX_CLIENT__CLIENT_SECRET'),
							personInfoTimeoutInMs: configService.get<number>('SCHULCONNEX_CLIENT__PERSON_INFO_TIMEOUT_IN_MS'),
							personenInfoTimeoutInMs: configService.get<number>('SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS'),
							policiesInfoTimeoutInMs: configService.get<number>('SCHULCONNEX_CLIENT__POLICIES_INFO_TIMEOUT_IN_MS'),
						};
						return new SchulconnexRestClient(options, httpService, oauthAdapterService, logger);
					},
					inject: [HttpService, OauthAdapterService, Logger, ConfigService],
				},
			],
			exports: [SchulconnexRestClient],
		};
	}
}
