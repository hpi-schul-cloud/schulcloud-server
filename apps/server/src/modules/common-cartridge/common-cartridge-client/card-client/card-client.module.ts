import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module } from '@nestjs/common';
import { CardClientAdapter } from './card-client.adapter';
import { CardClientConfig } from './card-client.config';
import { BoardCardApi, Configuration } from './cards-api-client';

@Module({})
export class CardClientModule {
	public static register(configInjectionToken: string, configConstructor: new () => CardClientConfig): DynamicModule {
		const providers = [
			CardClientAdapter,
			{
				provide: BoardCardApi,
				useFactory: (configInstance: CardClientConfig): BoardCardApi => {
					const { basePath } = configInstance;
					const configuration = new Configuration({
						basePath: `${basePath}/v3`,
					});

					return new BoardCardApi(configuration);
				},
				inject: [configInjectionToken],
			},
		];
		return {
			module: CardClientModule,
			imports: [ConfigurationModule.register(configInjectionToken, configConstructor)],
			providers,
			exports: [CardClientAdapter],
		};
	}
}
