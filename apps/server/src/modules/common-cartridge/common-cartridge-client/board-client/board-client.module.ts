import { DynamicModule, Module } from '@nestjs/common';
import { BoardClientAdapter } from './board-client.adapter';
import { BoardApi, Configuration } from './board-api-client';
import { BoardClientConfig } from './board-client.config';

@Module({})
export class BoardClientModule {
	static register(config: BoardClientConfig): DynamicModule {
		const providers = [
			BoardClientAdapter,
			{
				provide: BoardApi,
				useFactory: () => {
					const configuration = new Configuration(config);
					return new BoardApi(configuration);
				},
			},
		];

		return {
			module: BoardClientModule,
			providers,
			exports: [BoardClientAdapter],
		};
	}
}
