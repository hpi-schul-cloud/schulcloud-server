import { ConfigurationModule } from '@infra/configuration';
import { LoggerModule } from '@infra/logger';
import { OauthAdapterModule } from '@infra/oauth-adapter';
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
			imports: [
				HttpModule,
				LoggerModule,
				OauthAdapterModule,
				ConfigurationModule.register(configInjectionToken, configConstructor),
			],
			providers: [SchulconnexRestClient],
			exports: [SchulconnexRestClient],
		};
	}
}
