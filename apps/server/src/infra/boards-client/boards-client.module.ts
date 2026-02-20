import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module } from '@nestjs/common';
import { BoardsClientAdapter } from './boards-client.adapter';
import { InternalBoardsClientConfig } from './boards-client.config';
import { BoardApi, Configuration } from './generated';

@Module({})
export class BoardsClientModule {
	public static register(
		configInjectionToken: string,
		configConstructor: new () => InternalBoardsClientConfig
	): DynamicModule {
		const providers = [
			BoardsClientAdapter,
			{
				provide: BoardApi,
				useFactory: (config: InternalBoardsClientConfig): BoardApi => {
					const { basePath } = config;
					const configuration = new Configuration({
						basePath: `${basePath}/v3`,
					});

					return new BoardApi(configuration);
				},
				inject: [configInjectionToken],
			},
		];

		return {
			module: BoardsClientModule,
			imports: [ConfigurationModule.register(configInjectionToken, configConstructor)],
			providers,
			exports: [BoardsClientAdapter],
		};
	}
}
