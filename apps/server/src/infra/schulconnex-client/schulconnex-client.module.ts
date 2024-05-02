import { OauthAdapterService } from '@modules/oauth/service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { Logger, LoggerModule } from '@src/core/logger';
import { SchulconnexRestClient } from './schulconnex-rest-client';
import { SchulconnexRestClientOptions } from './schulconnex-rest-client-options';

@Module({})
export class SchulconnexClientModule {
	static register(options: SchulconnexRestClientOptions): DynamicModule {
		return {
			imports: [HttpModule, LoggerModule],
			module: SchulconnexClientModule,
			providers: [
				OauthAdapterService,
				{
					provide: SchulconnexRestClient,
					useFactory: (httpService: HttpService, oauthAdapterService: OauthAdapterService, logger: Logger) =>
						new SchulconnexRestClient(options, httpService, oauthAdapterService, logger),
					inject: [HttpService, OauthAdapterService, Logger],
				},
			],
			exports: [SchulconnexRestClient],
		};
	}
}
