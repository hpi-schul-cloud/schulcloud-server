import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { JwtExtractor } from '@shared/common/utils';
import { Request } from 'express';
import { ColumnClientAdapter } from './column-client.adapter';
import { InternalColumnClientConfig } from './column-client.config';
import { BoardColumnApi, Configuration } from './generated';

@Module({})
export class ColumnClientModule {
	public static register(
		configInjectionToken: string,
		configConstructor: new () => InternalColumnClientConfig
	): DynamicModule {
		const providers = [
			ColumnClientAdapter,
			{
				provide: BoardColumnApi,
				scope: Scope.REQUEST,
				useFactory: (config: InternalColumnClientConfig, request: Request): BoardColumnApi => {
					const { basePath } = config;
					const accessToken = JwtExtractor.extractJwtFromRequestOrFail(request);
					const configuration = new Configuration({
						basePath: `${basePath}/v3`,
						accessToken,
					});

					return new BoardColumnApi(configuration);
				},
				inject: [configInjectionToken, REQUEST],
			},
		];

		return {
			module: ColumnClientModule,
			imports: [ConfigurationModule.register(configInjectionToken, configConstructor)],
			providers,
			exports: [ColumnClientAdapter],
		};
	}
}
