import { Module, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { extractJwtFromRequest } from '@shared/common/utils/jwt';
import { LoggerModule } from '@core/logger';
import { Request } from 'express';
import { HttpModule } from '@nestjs/axios';
import { FilesStorageClientAdapter } from './files-storage-client.adapter';
import { FilesStorageClientConfig } from './files-storage-client.config';
import { Configuration, FileApi } from './generated';

@Module({
	imports: [LoggerModule, HttpModule],
	providers: [
		FilesStorageClientAdapter,
		{
			provide: FileApi,
			scope: Scope.REQUEST,
			useFactory: (configService: ConfigService<FilesStorageClientConfig, true>, request: Request): FileApi => {
				const basePath = configService.getOrThrow<string>('FILES_STORAGE__SERVICE_BASE_URL');

				const config = new Configuration({
					accessToken: extractJwtFromRequest(request),
					basePath: `${basePath}/api/v3`,
				});

				return new FileApi(config);
			},
			inject: [ConfigService, REQUEST],
		},
	],
	exports: [FilesStorageClientAdapter],
})
export class FilesStorageClientModule {}
