import { OauthAdapterService, OauthModule } from '@modules/oauth';
import { HttpModule, HttpService } from '@nestjs/axios';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { Logger, LoggerModule } from '@src/core/logger';
import { SchulconnexRestClient } from './schulconnex-rest-client';
import { SchulconnexRestClientOptions } from './schulconnex-rest-client-options';

@Global()
/**
 * @Global is used here to make sure that the module is only instantiated once, with the configuration and can be used in every module.
 * Otherwise, you need to import the module with configuration in every module where you want to use it.
 */
@Module({})
export class SchulconnexClientModule {
	static register(options: SchulconnexRestClientOptions): DynamicModule {
		return {
			imports: [HttpModule, OauthModule, LoggerModule],
			module: SchulconnexClientModule,
			providers: [
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
