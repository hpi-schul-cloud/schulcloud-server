import { ErrorLogger, Logger, LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { SagaModule } from '@modules/saga';
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
			imports: [
				LoggerModule,
				HttpModule,
				SagaModule,
				ConfigurationModule.register(configInjectionToken, configConstructor),
			],
			providers: [
				{
					provide: FileApi,
					scope: Scope.REQUEST,
					useFactory: (configService: InternalFilesStorageClientConfig, request: Request): FileApi => {
						const { basePath } = configService;

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
						logger: Logger,
						errorLogger: ErrorLogger,
						httpService: HttpService,
						config: InternalFilesStorageClientConfig,
						req: Request
					): FilesStorageClientAdapter => new FilesStorageClientAdapter(logger, errorLogger, httpService, config, req),
					inject: [Logger, ErrorLogger, HttpService, configInjectionToken, REQUEST],
				},
			],
			exports: [FilesStorageClientAdapter, FileApi],
		};
	}
}
