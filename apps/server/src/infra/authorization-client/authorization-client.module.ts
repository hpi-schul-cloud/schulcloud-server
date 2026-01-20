import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module } from '@nestjs/common';
import { AuthorizationApi, Configuration } from './authorization-api-client';
import { AuthorizationClientAdapter } from './authorization-client.adapter';
import { InternalAuthorizationClientConfig } from './authorization-api-client.config';

@Module({})
export class AuthorizationClientModule {
	public static register(
		configInjectionToken: string,
		config: new () => InternalAuthorizationClientConfig
	): DynamicModule {
		const providers = [
			AuthorizationClientAdapter,
			{
				provide: AuthorizationApi,
				useFactory: (configInstance: InternalAuthorizationClientConfig): AuthorizationApi => {
					const configuration = new Configuration(configInstance);
					return new AuthorizationApi(configuration);
				},
				inject: [configInjectionToken],
			},
		];

		return {
			module: AuthorizationClientModule,
			imports: [ConfigurationModule.register(configInjectionToken, config)],
			providers,
			exports: [AuthorizationClientAdapter],
		};
	}
}
