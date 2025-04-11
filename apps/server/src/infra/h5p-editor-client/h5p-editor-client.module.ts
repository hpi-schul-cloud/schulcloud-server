import { LoggerModule } from '@core/logger';
import { HttpModule } from '@nestjs/axios';
import { Module, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { JwtExtractor } from '@shared/common/utils/jwt';
import { Request } from 'express';
import { Configuration, H5pEditorApi } from './generated';
import { H5PEditorClientConfig } from './hp5-editor-client.config';

@Module({
	imports: [LoggerModule, HttpModule],
	providers: [
		{
			provide: H5pEditorApi,
			scope: Scope.REQUEST,
			useFactory: (configService: ConfigService<H5PEditorClientConfig, true>, request: Request): H5pEditorApi => {
				const basePath = configService.getOrThrow<string>('H5P_EDITOR__SERVICE_BASE_URL');

				const config = new Configuration({
					accessToken: JwtExtractor.extractJwtFromRequestOrFail(request),
					basePath: `${basePath}/api/v3`,
				});

				return new H5pEditorApi(config);
			},
			inject: [ConfigService, REQUEST],
		},
	],
	exports: [H5pEditorApi],
})
export class H5pEditorClientModule {}
