import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module } from '@nestjs/common';
import { AuthorApi, GroupApi, PadApi, SessionApi } from './etherpad-api-client/api';
import { Configuration, ConfigurationParameters } from './etherpad-api-client/configuration';
import { EtherpadClientAdapter } from './etherpad-client.adapter';

export interface EtherpadClientConfig extends ConfigurationParameters {
	apiKey?: string;
	basePath?: string;
}

const configToken = 'INTERNAL_ETHERPAD_CLIENT_CONFIG_TOKEN';

@Module({})
export class EtherpadClientModule {
	public static register<T extends object>(constructor: new () => T): DynamicModule {
		const providers = [
			EtherpadClientAdapter,
			{
				provide: GroupApi,
				useFactory: (config: EtherpadClientConfig) => {
					const configuration = new Configuration(config);
					return new GroupApi(configuration);
				},
				inject: [configToken],
			},
			{
				provide: SessionApi,
				useFactory: (config: EtherpadClientConfig) => {
					const configuration = new Configuration(config);
					return new SessionApi(configuration);
				},
				inject: [configToken],
			},
			{
				provide: AuthorApi,
				useFactory: (config: EtherpadClientConfig) => {
					const configuration = new Configuration(config);
					return new AuthorApi(configuration);
				},
				inject: [configToken],
			},
			{
				provide: PadApi,
				useFactory: (config: EtherpadClientConfig) => {
					const configuration = new Configuration(config);
					return new PadApi(configuration);
				},
				inject: [configToken],
			},
		];

		return {
			module: EtherpadClientModule,
			imports: [ConfigurationModule.register(configToken, constructor)],
			providers,
			exports: [EtherpadClientAdapter],
		};
	}
}
