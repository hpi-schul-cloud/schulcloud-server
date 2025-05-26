import { Module, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { JwtExtractor } from '@shared/common/utils';
import { Request } from 'express';
import { H5pEditorClientAdapter } from './h5p-editor-client.adapter';
import { H5pEditorApi, Configuration } from './generated';
import type { H5pEditorClientConfig } from './h5p-editor-client.config';

@Module({
	imports: [],
	providers: [
		H5pEditorClientAdapter,
		{
			provide: H5pEditorApi,
			scope: Scope.REQUEST,
			useFactory: (configService: ConfigService<H5pEditorClientConfig, true>, request: Request): H5pEditorApi => {
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
	exports: [H5pEditorClientAdapter],
})
export class H5pEditorClientModule {}
