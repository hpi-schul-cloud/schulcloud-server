import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { OauthAdapterService } from '@modules/oauth-adapter';
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { SchulconnexRestClient } from './schulconnex-rest-client';
import { InternalSchulconnexClientConfig } from './schulconnex-client-config';

@Module({})
export class SchulconnexClientModule {
	public static register(
		injectionToken: string,
		Constructor: new () => InternalSchulconnexClientConfig
	): DynamicModule {
		return {
			module: SchulconnexClientModule,
			imports: [HttpModule, LoggerModule, ConfigurationModule.register(injectionToken, Constructor)],
			providers: [OauthAdapterService, SchulconnexRestClient],
			exports: [SchulconnexRestClient],
		};
	}
}
