import { Module } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ALL_ENTITIES } from '@shared/domain';
import { Configuration } from '@hpi-schul-cloud/commons';
import { LoggerModule } from '@src/core/logger';
import { FilesStorageController } from './controller/files-storage.controller';
import { S3ClientAdapter } from './client/s3-client.adapter';
import { S3Config } from './interface/config';
import { AuthModule } from '../authentication/auth.module';
import { DB_URL, DB_USERNAME, DB_PASSWORD } from '../../config';
import { FilesStorageUC } from './uc/files-storage.uc';

const config: S3Config = {
	endpoint: Configuration.get('FILES_STORAGE__S3_ENDPOINT') as string,
	region: Configuration.get('FILES_STORAGE__S3_REGION') as string,
	bucket: Configuration.get('FILES_STORAGE__S3_BUCKET') as string,
	accessKeyId: Configuration.get('FILES_STORAGE__S3_ACCESS_KEY_ID') as string,
	secretAccessKey: Configuration.get('FILES_STORAGE__S3_SECRET_ACCESS_KEY') as string,
};

@Module({
	imports: [
		AuthModule,
		LoggerModule,
		MikroOrmModule.forRoot({
			type: 'mongo',
			// TODO add mongoose options as mongo options (see database.js)
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: ALL_ENTITIES,
			// debug: true, // use it for locally debugging of querys
		}),
	],
	controllers: [FilesStorageController],
	providers: [
		FilesStorageUC,
		{
			provide: 'S3_Config',
			useValue: config,
		},
		{
			provide: 'S3_Client',
			useValue: new S3Client({
				region: config.region,
				credentials: {
					accessKeyId: config.accessKeyId,
					secretAccessKey: config.secretAccessKey,
				},
				endpoint: config.endpoint,
				forcePathStyle: true,
				tls: true,
			}),
		},
		S3ClientAdapter,
	],
})
export class FilesStorageModule {}
