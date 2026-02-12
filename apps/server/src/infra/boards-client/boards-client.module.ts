import { Module, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { JwtExtractor } from '@shared/common/utils';
import axios from 'axios';
import { Request } from 'express';
import { BoardsClientAdapter } from './boards-client.adapter';
import { BoardsClientConfig } from './boards-client.config';
import { BoardApi, Configuration } from './generated';

@Module({
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

				const axiosInstance = axios.create({ timeout: 60000 });
				return new BoardApi(configuration, undefined, axiosInstance);
			},
			inject: [ConfigService, REQUEST],
		},
	],
	exports: [BoardsClientAdapter],
})
export class BoardsClientModule {}
