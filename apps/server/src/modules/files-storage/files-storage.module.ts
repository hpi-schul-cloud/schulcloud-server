import { DynamicModule, Module, NotFoundException } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { Configuration } from '@hpi-schul-cloud/commons';
import { FileRecordRepo } from '@shared/repo';
import { AuthModule } from '@src/modules/authentication/auth.module';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MongoDatabaseModuleOptions } from '@shared/infra/database/mongo-memory-database/types';
import { CoreModule } from '@src/core';
import { CommonModule, CommonTestModule } from '@src/common.module';
import { AntivirusModule } from '@shared/infra/antivirus/antivirus.module';
import { FilesStorageController } from './controller/files-storage.controller';
import { S3ClientAdapter } from './client/s3-client.adapter';
import { S3Config } from './interface/config';
import { FilesStorageUC } from './uc/files-storage.uc';
import { FileRecordUC } from './uc/file-record.uc';
import { FileSecurityController } from './controller/file-security.controller';

// The configurations lookup
// config/development.json for development
// config/test.json for tests
const config = {
	endpoint: Configuration.get('FILES_STORAGE__S3_ENDPOINT') as string,
	region: Configuration.get('FILES_STORAGE__S3_REGION') as string,
	bucket: Configuration.get('FILES_STORAGE__S3_BUCKET') as string,
	accessKeyId: Configuration.get('FILES_STORAGE__S3_ACCESS_KEY_ID') as string,
	secretAccessKey: Configuration.get('FILES_STORAGE__S3_SECRET_ACCESS_KEY') as string,
};

const imports = [
	AuthModule,
	CoreModule,
	AntivirusModule.forRoot({
		enabled: Configuration.get('ENABLE_FILE_SECURITY_CHECK') as boolean,
		filesServiceBaseUrl: Configuration.get('FILES_STORAGE__SERVICE_BASE_URL') as string,
		exchange: Configuration.get('ANTIVIRUS_EXCHANGE') as string,
		routingKey: Configuration.get('ANTIVIRUS_ROUTING_KEY') as string,
	}),
];
const providers = [
	FilesStorageUC,
	FileRecordUC,
	{
		provide: 'S3_Client',
		useFactory: (configProvider: S3Config) => {
			return new S3Client({
				region: configProvider.region,
				credentials: {
					accessKeyId: configProvider.accessKeyId,
					secretAccessKey: configProvider.secretAccessKey,
				},
				endpoint: configProvider.endpoint,
				forcePathStyle: true,
				tls: true,
			});
		},
		inject: ['S3_Config'],
	},
	{
		provide: 'S3_Config',
		useValue: config,
	},
	S3ClientAdapter,
	FileRecordRepo,
];

const controllers = [FilesStorageController, FileSecurityController];

@Module({
	imports: [...imports, CommonModule],
	controllers,
	providers,
})
export class FilesStorageModule {}

@Module({
	imports: [...imports, CommonTestModule],
	controllers,
	providers,
})
export class FilesStorageTestModule {}
