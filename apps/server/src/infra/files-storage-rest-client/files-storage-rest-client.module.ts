import { Logger, LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { HttpModule, HttpService } from '@nestjs/axios';
import { DynamicModule, Module, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { FilesStorageClientAdapter } from './files-storage-client.adapter';
import { InternalFilesStorageClientConfig } from './files-storage-client.config';
import { Configuration, FileApi } from './generated';

@Module({})
export class FilesStorageRestClientModule {
	public static register(
		configInjectionToken: string,
		configConstructor: new () => InternalFilesStorageClientConfig
	): DynamicModule {
		return {
			module: FilesStorageRestClientModule,
			imports: [LoggerModule, HttpModule, ConfigurationModule.register(configInjectionToken, configConstructor)],
			providers: [
				{
					provide: FilesStorageClientAdapter,
					scope: Scope.REQUEST,
					useFactory: (
						api: FileApi,
						logger: Logger,
						httpService: HttpService,
						internalConfig: InternalFilesStorageClientConfig,
						req: Request
					): FilesStorageClientAdapter => new FilesStorageClientAdapter(api, logger, httpService, internalConfig, req),
					inject: [FileApi, Logger, HttpService, configInjectionToken, REQUEST],
				},
				{
					provide: FileApi,
					useFactory: (internalConfig: InternalFilesStorageClientConfig): FileApi => {
						const { basePath } = internalConfig;
						const config = new Configuration({
							basePath: `${basePath}/api/v3`,
						});

						return new FileApi(config);
					},
					inject: [configInjectionToken],
				},
			],
			exports: [FilesStorageClientAdapter],
		};
	}
}
