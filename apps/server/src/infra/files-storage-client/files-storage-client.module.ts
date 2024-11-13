import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilesStorageClientAdapter } from './files-storage-client.adapter';
import { FilesStorageClientConfig } from './files-storage-client.config';
import { Configuration, FileApi } from './generated';

// TODO: Rename the module, because there is another module with the same name
@Module({
	providers: [
		{
			provide: FilesStorageClientAdapter,
			useFactory: (configService: ConfigService<FilesStorageClientConfig, true>): FileApi => {
				const config = new Configuration({
					basePath: configService.getOrThrow('FILES_STORAGE__SERVICE_BASE_URL'),
				});

				return new FileApi(config);
			},
			inject: [ConfigService],
		},
	],
	exports: [FilesStorageClientAdapter],
})
export class FilesStorageClientModule {}
