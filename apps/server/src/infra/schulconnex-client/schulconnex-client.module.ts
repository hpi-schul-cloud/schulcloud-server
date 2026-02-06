import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { OauthAdapterService } from '@modules/oauth-adapter';
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { InternalSchulconnexClientConfig } from './schulconnex-client.config';
import { SchulconnexRestClient } from './schulconnex-rest-client';

@Module({})
export class SchulconnexClientModule {
	public static register(
		configInjectionToken: string,
		configConstructor: new () => InternalSchulconnexClientConfig
	): DynamicModule {
		return {
			module: SchulconnexClientModule,
			imports: [HttpModule, LoggerModule, ConfigurationModule.register(configInjectionToken, configConstructor)],
			providers: [OauthAdapterService, SchulconnexRestClient],
			exports: [SchulconnexRestClient],
		};
	}
}
