import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BoardsClientAdapter } from './boards-client.adapter';
import { BoardsClientConfig } from './boards-client.config';
import { BoardApi, Configuration } from './generated';

@Module({
	providers: [
		BoardsClientAdapter,
		{
			provide: BoardApi,
			useFactory: (configService: ConfigService<BoardsClientConfig, true>): BoardApi => {
				const basePath = configService.getOrThrow<string>('API_HOST');
				const configuration = new Configuration({
					basePath: `${basePath}/v3`,
				});

				return new BoardApi(configuration);
			},
			inject: [ConfigService],
		},
	],
	exports: [BoardsClientAdapter],
})
export class BoardsClientModule {}
