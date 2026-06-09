import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module, Type } from '@nestjs/common';
import { AuthenticationClientAdapter } from './authentication-client.adapter';
import {
	AUTHENTICATION_CLIENT_CONFIG_TOKEN,
	AuthenticationClientConfig,
	InternalAuthenticationClientConfig,
} from './authentication-client.config';
import { AuthenticationApi, Configuration } from './generated';

@Module({})
export class AuthenticationClientModule {
	public static register(
		configInjectionToken: string = AUTHENTICATION_CLIENT_CONFIG_TOKEN,
		configConstructor: Type<InternalAuthenticationClientConfig> = AuthenticationClientConfig
	): DynamicModule {
		const providers = [
			AuthenticationClientAdapter,
			{
				provide: AuthenticationApi,
				useFactory: (configInstance: InternalAuthenticationClientConfig): AuthenticationApi => {
					const { basePath } = configInstance;
					const configuration = new Configuration({
						basePath: `${basePath}/v3`,
					});
					return new AuthenticationApi(configuration);
				},
				inject: [configInjectionToken],
			},
		];

		return {
			module: AuthenticationClientModule,
			imports: [ConfigurationModule.register(configInjectionToken, configConstructor)],
			providers,
			exports: [AuthenticationClientAdapter],
		};
	}
}
