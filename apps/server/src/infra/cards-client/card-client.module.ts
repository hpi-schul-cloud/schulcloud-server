import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module } from '@nestjs/common';
import { CardClientAdapter } from './card-client.adapter';
import { InternalCardClientConfig } from './card-client.config';
import { BoardCardApi, BoardElementApi, Configuration } from './generated';

@Module({})
export class CardClientModule {
	public static register(
		configInjectionToken: string,
		configConstructor: new () => InternalCardClientConfig
	): DynamicModule {
		const providers = [
			CardClientAdapter,
			{
				provide: BoardCardApi,
				useFactory: (config: InternalCardClientConfig): BoardCardApi => {
					const { basePath } = config;
					const configuration = new Configuration({
						basePath: `${basePath}/v3`,
					});

					return new BoardCardApi(configuration);
				},
				inject: [configInjectionToken],
			},
			{
				provide: BoardElementApi,
				useFactory: (config: InternalCardClientConfig): BoardElementApi => {
					const { basePath } = config;
					const configuration = new Configuration({
						basePath: `${basePath}/v3`,
					});

					return new BoardElementApi(configuration);
				},
				inject: [configInjectionToken],
			},
		];

		return {
			module: CardClientModule,
			imports: [ConfigurationModule.register(configInjectionToken, configConstructor)],
			exports: [CardClientAdapter],
			providers,
		};
	}
}
