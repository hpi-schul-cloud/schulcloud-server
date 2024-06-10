import { DynamicModule, Module } from '@nestjs/common';
import { AuthorizationApi, Configuration, ConfigurationParameters } from './authorization-api-client';
import { AuthorizationClientAdapter } from './authorization-client.adapter';

export interface AuthorizationClientConfig extends ConfigurationParameters {
	basePath?: string;
}

@Module({})
export class AuthorizationClientModule {
	static register(config: AuthorizationClientConfig): DynamicModule {
		const providers = [
			AuthorizationClientAdapter,
			{
				provide: AuthorizationApi,
				useFactory: () => {
					const configuration = new Configuration(config);
					return new AuthorizationApi(configuration);
				},
			},
		];

		return {
			module: AuthorizationClientModule,
			providers,
			exports: [AuthorizationClientAdapter],
		};
	}
}
