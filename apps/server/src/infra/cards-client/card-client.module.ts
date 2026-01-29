import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { JwtExtractor } from '@shared/common/utils';
import { Request } from 'express';
import { CardClientAdapter } from './card-client.adapter';
import { InternalCardClientConfig } from './card-client.config';
import { BoardCardApi, BoardElementApi, Configuration } from './generated';

@Module({})
export class CardClientModule {
	public static register(
		configInjectionToken: string,
		configConstructor: new () => InternalCardClientConfig
	): DynamicModule {
		const providers = [
			CardClientAdapter,
			{
				provide: BoardCardApi,
				scope: Scope.REQUEST,
				useFactory: (config: InternalCardClientConfig, request: Request): BoardCardApi => {
					const { basePath } = config;
					const accessToken = JwtExtractor.extractJwtFromRequestOrFail(request);
					const configuration = new Configuration({
						basePath: `${basePath}/v3`,
						accessToken,
					});

					return new BoardCardApi(configuration);
				},
				inject: [configInjectionToken, REQUEST],
			},
			{
				provide: BoardElementApi,
				scope: Scope.REQUEST,
				useFactory: (config: InternalCardClientConfig, request: Request): BoardElementApi => {
					const { basePath } = config;
					const accessToken = JwtExtractor.extractJwtFromRequestOrFail(request);
					const configuration = new Configuration({
						basePath: `${basePath}/v3`,
						accessToken,
					});

					return new BoardElementApi(configuration);
				},
				inject: [configInjectionToken, REQUEST],
			},
		];

		return {
			module: CardClientModule,
			imports: [ConfigurationModule.register(configInjectionToken, configConstructor)],
			exports: [CardClientAdapter],
			providers,
		};
	}
}
