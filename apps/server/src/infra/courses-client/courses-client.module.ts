import { Module, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { JwtExtractor } from '@shared/common/utils';
import { Request } from 'express';
import { CoursesClientAdapter } from './courses-client.adapter';
import { CoursesClientConfig } from './courses-client.config';
import { Configuration, CoursesApi } from './generated';

@Module({
	providers: [
		CoursesClientAdapter,
		{
			provide: CoursesApi,
			scope: Scope.REQUEST,
			useFactory: (configService: ConfigService<CoursesClientConfig, true>, request: Request): CoursesApi => {
				const basePath = configService.getOrThrow<string>('API_HOST');
				const accessToken = JwtExtractor.extractJwtFromRequestOrFail(request);
				const configuration = new Configuration({
					basePath: `${basePath}/v3`,
					accessToken,
				});

				return new CoursesApi(configuration);
			},
			inject: [ConfigService, REQUEST],
		},
	],
	exports: [CoursesClientAdapter],
})
export class CoursesClientModule {}
