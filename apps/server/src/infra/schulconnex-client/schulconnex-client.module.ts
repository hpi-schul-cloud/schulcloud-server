import { OauthAdapterService, OauthModule } from '@modules/oauth';
import { HttpModule, HttpService } from '@nestjs/axios';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { SchulconnexRestClientOptions } from './schulconnex-rest-client-options';
import { SchulconnexRestClient } from './schulconnex-rest-client.service';

@Global()
@Module({})
export class SchulconnexClientModule {
	static forRoot(options: SchulconnexRestClientOptions): DynamicModule {
		return {
			imports: [HttpModule, OauthModule],
			module: SchulconnexClientModule,
			providers: [
				{
					provide: SchulconnexRestClient,
					useFactory: (httpService: HttpService, oauthAdapterService: OauthAdapterService) =>
						new SchulconnexRestClient(options, httpService, oauthAdapterService),
					inject: [HttpService, OauthAdapterService],
				},
			],
			exports: [SchulconnexRestClient],
		};
	}
}
