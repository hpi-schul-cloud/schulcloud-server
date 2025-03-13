import { Module, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { JwtExtractor } from '@shared/common/utils';
import { Request } from 'express';
import { BoardColumnApi, Configuration } from './generated';
import { ColumnClientAdapter } from './column-client.adapter';
import { ColumnClientConfig } from './column-client.config';

@Module({
	providers: [
		ColumnClientAdapter,
		{
			provide: BoardColumnApi,
			scope: Scope.REQUEST,
			useFactory: (configService: ConfigService<ColumnClientConfig, true>, request: Request): BoardColumnApi => {
				const basePath = configService.getOrThrow<string>('API_HOST');
				const accessToken = JwtExtractor.extractJwtFromRequestOrFail(request);
				const configuration = new Configuration({
					basePath: `${basePath}/v3`,
					accessToken,
				});

				return new BoardColumnApi(configuration);
			},
			inject: [ConfigService, REQUEST],
		},
	],
	exports: [ColumnClientAdapter],
})
export class ColumnClientModule {}
