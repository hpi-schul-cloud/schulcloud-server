import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { JwtExtractor } from '@shared/common/utils';
import { Request } from 'express';
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
				scope: Scope.REQUEST,
				useFactory: (config: InternalBoardsClientConfig, request: Request): BoardApi => {
					const { basePath } = config;
					const accessToken = JwtExtractor.extractJwtFromRequestOrFail(request);
					const configuration = new Configuration({
						basePath: `${basePath}/v3`,
						accessToken,
					});

					return new BoardApi(configuration);
				},
				inject: [configInjectionToken, REQUEST],
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
