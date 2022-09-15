import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@src/core/logger';
import { Configuration, FileApi } from './filesStorageApi/v3';
import { IFilesStorageClientConfig } from './interfaces';
import { CopyFilesService } from './uc/copy-files.service';
import { FilesStorageClientAdapterService } from './uc/files-storage-client.service';

@Module({
	imports: [],
	controllers: [],
	providers: [
		FilesStorageClientAdapterService,
		CopyFilesService,
		Logger,
		{
			provide: 'FileStorageClient',
			useFactory: (configService: ConfigService<IFilesStorageClientConfig, true>) => {
				const apiUri = '/api/v3'; // == API_VERSION_PATH
				const baseUrl = configService.get<string>('FILE_STORAGE_BASE_URL');
				const timeout = configService.get<number>('INCOMING_REQUEST_TIMEOUT');

				const options = new Configuration({
					baseOptions: { timeout },
				});

				return new FileApi(options, baseUrl + apiUri);
			},
			inject: [ConfigService],
		},
	],
	exports: [FilesStorageClientAdapterService, CopyFilesService],
})
export class FilesStorageClientModule {}
