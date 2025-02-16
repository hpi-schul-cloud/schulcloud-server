import { Module, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { JwtExtractor } from '@shared/common/utils';
import { Configuration, LessonApi } from './generated';
import { LessonsClientAdapter } from './lessons-client.adapter';
import { LessonsClientConfig } from './lessons-client.config';

@Module({
	providers: [
		LessonsClientAdapter,
		{
			provide: LessonApi,
			scope: Scope.REQUEST,
			useFactory: (configService: ConfigService<LessonsClientConfig, true>, request: Request): LessonApi => {
				const basePath = configService.getOrThrow<string>('API_HOST');
				const accessToken = JwtExtractor.extractJwtFromRequest(request);
				const configuration = new Configuration({
					basePath: `${basePath}/v3`,
					accessToken,
				});

				return new LessonApi(configuration);
			},
			inject: [ConfigService, REQUEST],
		},
	],
	exports: [LessonsClientAdapter],
})
export class LessonsClientModule {}
