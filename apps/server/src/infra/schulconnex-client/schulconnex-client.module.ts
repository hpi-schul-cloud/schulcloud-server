import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { OauthAdapterService } from '@modules/oauth-adapter';
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { SchulconnexClientConfig } from './schulconnex-client-config';
import { SchulconnexRestClient } from './schulconnex-rest-client';

@Module({})
export class SchulconnexClientModule {
	public static register<T extends SchulconnexClientConfig>(
		injectionToken: string,
		Constructor: new () => T
	): DynamicModule {
		return {
			module: SchulconnexClientModule,
			imports: [HttpModule, LoggerModule, ConfigurationModule.register(injectionToken, Constructor)],
			providers: [OauthAdapterService, SchulconnexRestClient],
			exports: [SchulconnexRestClient],
		};
	}
}
