import { DynamicModule, Module } from '@nestjs/common';
import { CardClientConfig } from './card-client.config';
import { CardClientAdapter } from './card-client.adapter';
import { BoardCardApi, Configuration } from './cards-api-client';

@Module({})
export class CardClientModule {
	static register(config: CardClientConfig): DynamicModule {
		const providers = [
			CardClientAdapter,
			{
				provide: BoardCardApi,
				useFactory: () => {
					const configuration = new Configuration(config);
					return new BoardCardApi(configuration);
				},
			},
		];
		return {
			module: CardClientModule,
			providers,
			exports: [CardClientAdapter],
		};
	}
}
