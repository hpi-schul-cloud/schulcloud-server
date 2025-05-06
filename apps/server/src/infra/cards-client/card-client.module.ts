import { Module, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { JwtExtractor } from '@shared/common/utils';
import { Request } from 'express';
import { CardClientAdapter, CardClientConfig } from '.';
import { BoardCardApi, BoardElementApi, Configuration } from './generated';

@Module({
	providers: [
		CardClientAdapter,
		{
			provide: BoardCardApi,
			scope: Scope.REQUEST,
			useFactory: (configService: ConfigService<CardClientConfig, true>, request: Request): BoardCardApi => {
				const basePath = configService.getOrThrow<string>('API_HOST');
				const accessToken = JwtExtractor.extractJwtFromRequestOrFail(request);
				const configuration = new Configuration({
					basePath: `${basePath}/v3`,
					accessToken,
				});

				return new BoardCardApi(configuration);
			},
			inject: [ConfigService, REQUEST],
		},
		{
			provide: BoardElementApi,
			scope: Scope.REQUEST,
			useFactory: (configService: ConfigService<CardClientConfig, true>, request: Request): BoardElementApi => {
				const basePath = configService.getOrThrow<string>('API_HOST');
				const accessToken = JwtExtractor.extractJwtFromRequestOrFail(request);
				const configuration = new Configuration({
					basePath: `${basePath}/v3`,
					accessToken,
				});

				return new BoardElementApi(configuration);
			},
			inject: [ConfigService, REQUEST],
		},
	],
	exports: [CardClientAdapter],
})
export class CardClientModule {}
