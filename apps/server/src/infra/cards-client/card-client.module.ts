import { Module } from '@nestjs/common';
import { CardClientAdapter, CardClientConfig } from '.';
import { ConfigService } from '@nestjs/config';
import { BoardCardApi, BoardElementApi, Configuration } from './generated';

@Module({
	providers: [
		CardClientAdapter,
		{
			provide: BoardCardApi,
			useFactory: (configService: ConfigService<CardClientConfig, true>): BoardCardApi => {
				const basePath = configService.getOrThrow<string>('API_HOST');
				const configuration = new Configuration({
					basePath: `${basePath}/v3`,
				});

				return new BoardCardApi(configuration);
			},
			inject: [ConfigService],
		},
		{
			provide: BoardElementApi,
			useFactory: (configService: ConfigService<CardClientConfig, true>): BoardElementApi => {
				const basePath = configService.getOrThrow<string>('API_HOST');
				const configuration = new Configuration({
					basePath: `${basePath}/v3`,
				});

				return new BoardElementApi(configuration);
			},
			inject: [ConfigService],
		},
	],
	exports: [CardClientAdapter],
})
export class CardClientModule {}
