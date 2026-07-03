import { ConfigurationModule } from '@infra/configuration';
import { LoggerModule } from '@infra/logger';
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
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
				FilesStorageClientAdapter,
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
