import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ColumnClientAdapter } from './column-client.adapter';
import { ColumnClientConfig } from './column-client.config';
import { BoardColumnApi, Configuration } from './generated';

@Module({
	providers: [
		ColumnClientAdapter,
		{
			provide: BoardColumnApi,
			useFactory: (configService: ConfigService<ColumnClientConfig, true>): BoardColumnApi => {
				const basePath = configService.getOrThrow<string>('API_HOST');
				const configuration = new Configuration({
					basePath: `${basePath}/v3`,
				});

				return new BoardColumnApi(configuration);
			},
			inject: [ConfigService],
		},
	],
	exports: [ColumnClientAdapter],
})
export class ColumnClientModule {}
