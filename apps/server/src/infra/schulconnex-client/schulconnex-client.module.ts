import { OauthAdapterService, OauthModule } from '@modules/oauth';
import { HttpModule, HttpService } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { SchulconnexClientConfiguration } from './schulconnex-client-configuration';
import { SchulconnexRestClient } from './schulconnex-rest-client.service';

@Module({})
export class SchulconnexClientModule {
	static forRoot(config: SchulconnexClientConfiguration): DynamicModule {
		return {
			imports: [HttpModule, OauthModule],
			module: SchulconnexClientModule,
			providers: [
				{
					provide: SchulconnexRestClient,
					useFactory: (httpService: HttpService, oauthAdapterService: OauthAdapterService) =>
						new SchulconnexRestClient(config, httpService, oauthAdapterService),
					inject: [HttpService, OauthAdapterService],
				},
			],
			exports: [SchulconnexRestClient],
		};
	}
}
