import { ConfigurationModule } from '@infra/configuration';
import { Module } from '@nestjs/common';
import { AuthorApi, GroupApi, PadApi, SessionApi } from './etherpad-api-client/api';
import { Configuration } from './etherpad-api-client/configuration';
import { EtherpadClientAdapter } from './etherpad-client.adapter';
import { ETHERPAD_CLIENT_CONFIG_TOKEN, EtherpadClientConfig } from './etherpad-client.config';

@Module({
	imports: [ConfigurationModule.register(ETHERPAD_CLIENT_CONFIG_TOKEN, EtherpadClientConfig)],
	providers: [
		EtherpadClientAdapter,
		{
			provide: GroupApi,
			useFactory: (config: EtherpadClientConfig): GroupApi => {
				const configuration = new Configuration(config);
				return new GroupApi(configuration);
			},
			inject: [ETHERPAD_CLIENT_CONFIG_TOKEN],
		},
		{
			provide: SessionApi,
			useFactory: (config: EtherpadClientConfig): SessionApi => {
				const configuration = new Configuration(config);
				return new SessionApi(configuration);
			},
			inject: [ETHERPAD_CLIENT_CONFIG_TOKEN],
		},
		{
			provide: AuthorApi,
			useFactory: (config: EtherpadClientConfig): AuthorApi => {
				const configuration = new Configuration(config);
				return new AuthorApi(configuration);
			},
			inject: [ETHERPAD_CLIENT_CONFIG_TOKEN],
		},
		{
			provide: PadApi,
			useFactory: (config: EtherpadClientConfig): PadApi => {
				const configuration = new Configuration(config);
				return new PadApi(configuration);
			},
			inject: [ETHERPAD_CLIENT_CONFIG_TOKEN],
		},
	],
	exports: [EtherpadClientAdapter],
})
export class EtherpadClientModule {}
