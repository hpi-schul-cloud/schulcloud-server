import { LoggerModule } from '@core/logger';
import { Module, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { JwtExtractor } from '@shared/common/utils';
import { BoardsClientAdapter } from './boards-client.adapter';
import { BoardsClientConfig } from './boards-client.config';
import { Configuration, BoardApi } from './generated';

@Module({
	imports: [LoggerModule],
	providers: [
		BoardsClientAdapter,
		{
			provide: BoardApi,
			scope: Scope.REQUEST,
			useFactory: (configService: ConfigService<BoardsClientConfig, true>, request: Request): BoardApi => {
				const basePath = configService.getOrThrow<string>('API_HOST');
				const accessToken = JwtExtractor.extractJwtFromRequestOrFail(request);
				const configuration = new Configuration({
					basePath: `${basePath}/v3`,
					accessToken,
				});

				return new BoardApi(configuration);
			},
			inject: [ConfigService, REQUEST],
		},
	],
	exports: [BoardsClientAdapter],
})
export class BoardsClientModule {}
