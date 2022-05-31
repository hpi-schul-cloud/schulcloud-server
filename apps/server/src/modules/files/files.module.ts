import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { Module, NotFoundException } from '@nestjs/common';
import { ALL_ENTITIES } from '@shared/domain';
import { FileStorageAdapter } from '@shared/infra/filestorage';
import { FileRecordRepo, FilesRepo, StorageProviderRepo } from '@shared/repo';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { LoggerModule } from '@src/core/logger';
import { S3Config } from '../files-storage/interface';
import { DeleteFilesConsole } from './job/delete-files.console';
import { SyncFilerecordsConsole } from './job/sync-filerecords.console';
import { SyncFilesRepo } from './repo/sync-files.repo';
import { DeleteFilesUc, SyncFilesUc } from './uc';
import { SyncFilesMetadataService } from './uc/sync-files-metadata.service';
import { SyncFilesStorageService } from './uc/sync-files-storage.service';

export const config: S3Config = {
	endpoint: Configuration.get('FILES_STORAGE__S3_ENDPOINT') as string,
	region: Configuration.get('FILES_STORAGE__S3_REGION') as string,
	bucket: Configuration.get('FILES_STORAGE__S3_BUCKET') as string,
	accessKeyId: Configuration.get('FILES_STORAGE__S3_ACCESS_KEY_ID') as string,
	secretAccessKey: Configuration.get('FILES_STORAGE__S3_SECRET_ACCESS_KEY') as string,
};

export const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => {
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		return new NotFoundException(`The requested ${entityName}: ${where} has not been found.`);
	},
};

@Module({
	imports: [
		LoggerModule,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			// TODO repeats server module definitions
			type: 'mongo',
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: ALL_ENTITIES,
			allowGlobalContext: true,
			findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => {
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				return new NotFoundException(`The requested ${entityName}: ${where} has not been found.`);
			},
		}),
	],
	providers: [
		DeleteFilesConsole,
		SyncFilerecordsConsole,
		DeleteFilesUc,
		SyncFilesUc,
		FilesRepo,
		FileRecordRepo,
		SyncFilesRepo,
		StorageProviderRepo,
		FileStorageAdapter,
		SyncFilesMetadataService,
		SyncFilesStorageService,
		{
			provide: 'Destination_S3_Config',
			useValue: config,
		},
	],
})
export class FilesModule {}
