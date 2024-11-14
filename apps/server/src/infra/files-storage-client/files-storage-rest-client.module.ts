import { Module, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { extractJwtFromRequest } from '@shared/common/utils/jwt';
import { Request } from 'express';
import { FilesStorageRestClientAdapter } from './files-storage-rest-client.adapter';
import { FilesStorageRestClientConfig } from './files-storage-rest-client.config';
import { Configuration, FileApi } from './generated';

@Module({
	providers: [
		{
			provide: FilesStorageRestClientAdapter,
			scope: Scope.REQUEST,
			useFactory: (configService: ConfigService<FilesStorageRestClientConfig, true>, request: Request): FileApi => {
				const config = new Configuration({
					basePath: configService.getOrThrow('FILES_STORAGE__SERVICE_BASE_URL'),
					accessToken: extractJwtFromRequest(request),
				});

				return new FileApi(config);
			},
			inject: [ConfigService, REQUEST],
		},
	],
	exports: [FilesStorageRestClientAdapter],
})
export class FilesStorageRestClientModule {}
