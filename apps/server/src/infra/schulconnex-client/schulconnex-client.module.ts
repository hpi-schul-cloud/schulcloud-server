import { OauthAdapterService } from '@modules/oauth/service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger, LoggerModule } from '@src/core/logger';
import { SchulconnexRestClient } from './schulconnex-rest-client';
import { SchulconnexRestClientOptions } from './schulconnex-rest-client-options';

@Module({})
export class SchulconnexClientModule {
	static registerAsync(): DynamicModule {
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
							personenInfoTimeoutInMs: configService.get<number>('SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS'),
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
