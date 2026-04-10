import { ErrorLogger, Logger, LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { HttpModule, HttpService } from '@nestjs/axios';
import { DynamicModule, Module, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { JwtExtractor } from '@shared/common/utils';
import { Request } from 'express';
import { FilesStorageClientAdapter } from './files-storage-client.adapter';
import { InternalFilesStorageClientConfig } from './files-storage-client.config';
import { Configuration, FileApi } from './generated';

@Module({})
export class FilesStorageClientModule {
	public static register(
		configInjectionToken: string,
		configConstructor: new () => InternalFilesStorageClientConfig
	): DynamicModule {
		return {
			module: FilesStorageClientModule,
			imports: [LoggerModule, HttpModule, ConfigurationModule.register(configInjectionToken, configConstructor)],
			providers: [
				{
					provide: FileApi,
					scope: Scope.REQUEST,
					useFactory: (internalConfig: InternalFilesStorageClientConfig, request: Request): FileApi => {
						const { basePath } = internalConfig;

						const config = new Configuration({
							accessToken: JwtExtractor.extractJwtFromRequestOrFail(request),
							basePath: `${basePath}/api/v3`,
						});

						return new FileApi(config);
					},
					inject: [configInjectionToken, REQUEST],
				},
				{
					provide: FilesStorageClientAdapter,
					scope: Scope.REQUEST,
					useFactory: (
						api: FileApi,
						logger: Logger,
						errorLogger: ErrorLogger,
						httpService: HttpService,
						internalConfig: InternalFilesStorageClientConfig,
						req: Request
					): FilesStorageClientAdapter =>
						new FilesStorageClientAdapter(api, logger, errorLogger, httpService, internalConfig, req),
					inject: [FileApi, Logger, ErrorLogger, HttpService, configInjectionToken, REQUEST],
				},
			],
			exports: [FilesStorageClientAdapter, FileApi],
		};
	}
}
