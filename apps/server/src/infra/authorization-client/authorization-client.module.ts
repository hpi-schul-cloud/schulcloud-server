import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module } from '@nestjs/common';
import { AuthorizationApi, Configuration } from './authorization-api-client';
import { AuthorizationClientAdapter } from './authorization-client.adapter';
import { InternalAuthorizationClientConfig } from './authorization-client.config';

@Module({})
export class AuthorizationClientModule {
	public static register(
		configInjectionToken: string,
		configConstructor: new () => InternalAuthorizationClientConfig
	): DynamicModule {
		const providers = [
			AuthorizationClientAdapter,
			{
				provide: AuthorizationApi,
				useFactory: (configInstance: InternalAuthorizationClientConfig): AuthorizationApi => {
					const { basePath } = configInstance;
					const configuration = new Configuration({
						basePath: `${basePath}/v3`,
					});
					return new AuthorizationApi(configuration);
				},
				inject: [configInjectionToken],
			},
		];

		return {
			module: AuthorizationClientModule,
			imports: [ConfigurationModule.register(configInjectionToken, configConstructor)],
			providers,
			exports: [AuthorizationClientAdapter],
		};
	}
}
