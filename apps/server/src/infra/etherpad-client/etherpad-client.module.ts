import { DynamicModule, Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { EtherpadClientAdapter } from './etherpad-client.adapter';
import { AuthorApi, GroupApi, SessionApi } from './generated-etherpad-api-client/api';
import { Configuration, ConfigurationParameters } from './generated-etherpad-api-client/configuration';

export interface EtherpadClientConfig extends ConfigurationParameters {
	apiKey?: string;
	basePath?: string;
	cookieExpiresSeconds: number;
	cookieReleaseThreshold: number;
	padURI: string;
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
		];

		return {
			module: EtherpadClientModule,
			imports: [LoggerModule],
			providers,
			exports: [EtherpadClientAdapter],
		};
	}
}
