import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { JwtExtractor } from '@shared/common/utils';
import { Request } from 'express';
import { CoursesClientAdapter } from './courses-client.adapter';
import { InternalCoursesClientConfig } from './courses-client.config';
import { Configuration, CoursesApi } from './generated';

@Module({})
export class CoursesClientModule {
	public static register(
		configInjectionToken: string,
		configConstructor: new () => InternalCoursesClientConfig
	): DynamicModule {
		const providers = [
			CoursesClientAdapter,
			{
				provide: CoursesApi,
				scope: Scope.REQUEST,
				useFactory: (config: InternalCoursesClientConfig, request: Request): CoursesApi => {
					const { basePath } = config;
					const accessToken = JwtExtractor.extractJwtFromRequestOrFail(request);
					const configuration = new Configuration({
						basePath: `${basePath}/v3`,
						accessToken,
					});

					return new CoursesApi(configuration);
				},
				inject: [configInjectionToken, REQUEST],
			},
		];

		return {
			module: CoursesClientModule,
			imports: [ConfigurationModule.register(configInjectionToken, configConstructor)],
			providers,
			exports: [CoursesClientAdapter],
		};
	}
}
