import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module } from '@nestjs/common';
import { AuthorApi, GroupApi, PadApi, SessionApi } from './etherpad-api-client/api';
import { Configuration } from './etherpad-api-client/configuration';
import { InternalEtherpadClientConfig } from './etherpad-client-config.interface';
import { EtherpadClientAdapter } from './etherpad-client.adapter';

@Module({})
export class EtherpadClientModule {
	public static register(
		configInjectionToken: string,
		configConstructor: new () => InternalEtherpadClientConfig
	): DynamicModule {
		const providers = [
			EtherpadClientAdapter,
			{
				provide: GroupApi,
				useFactory: (config: InternalEtherpadClientConfig): GroupApi => {
					const configuration = new Configuration(config);
					return new GroupApi(configuration);
				},
				inject: [configInjectionToken],
			},
			{
				provide: SessionApi,
				useFactory: (config: InternalEtherpadClientConfig): SessionApi => {
					const configuration = new Configuration(config);
					return new SessionApi(configuration);
				},
				inject: [configInjectionToken],
			},
			{
				provide: AuthorApi,
				useFactory: (config: InternalEtherpadClientConfig): AuthorApi => {
					const configuration = new Configuration(config);
					return new AuthorApi(configuration);
				},
				inject: [configInjectionToken],
			},
			{
				provide: PadApi,
				useFactory: (config: InternalEtherpadClientConfig): PadApi => {
					const configuration = new Configuration(config);
					return new PadApi(configuration);
				},
				inject: [configInjectionToken],
			},
		];

		return {
			module: EtherpadClientModule,
			imports: [ConfigurationModule.register(configInjectionToken, configConstructor)],
			providers,
			exports: [EtherpadClientAdapter],
		};
	}
}
