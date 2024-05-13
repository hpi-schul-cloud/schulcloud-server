import { DynamicModule, Module } from '@nestjs/common';
import { AuthorApi, GroupApi, PadApi, SessionApi } from './etherpad-api-client/api';
import { Configuration, ConfigurationParameters } from './etherpad-api-client/configuration';
import { EtherpadClientAdapter } from './etherpad-client.adapter';

export interface EtherpadClientConfig extends ConfigurationParameters {
	apiKey?: string;
	basePath?: string;
}

@Module({})
export class EtherpadClientModule {
	static register(config: EtherpadClientConfig): DynamicModule {
		const providers = [
			EtherpadClientAdapter,
			{
				provide: GroupApi,
				useFactory: () => {
					const configuration = new Configuration(config);
					return new GroupApi(configuration);
				},
			},
			{
				provide: SessionApi,
				useFactory: () => {
					const configuration = new Configuration(config);
					return new SessionApi(configuration);
				},
			},
			{
				provide: AuthorApi,
				useFactory: () => {
					const configuration = new Configuration(config);
					return new AuthorApi(configuration);
				},
			},
			{
				provide: PadApi,
				useFactory: () => {
					const configuration = new Configuration(config);
					return new PadApi(configuration);
				},
			},
		];

		return {
			module: EtherpadClientModule,
			providers,
			exports: [EtherpadClientAdapter],
		};
	}
}
