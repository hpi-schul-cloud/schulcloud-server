import { DynamicModule, Module, NotFoundException } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { ALL_ENTITIES } from '@shared/domain';
import { Configuration } from '@hpi-schul-cloud/commons';
import { FileRecordRepo } from '@shared/repo';
import { AuthModule } from '@src/modules/authentication/auth.module';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MongoDatabaseModuleOptions } from '@shared/infra/database/mongo-memory-database/types';
import { CoreModule } from '@src/core';
import { FilesStorageController } from './controller/files-storage.controller';
import { S3ClientAdapter } from './client/s3-client.adapter';
import { S3Config } from './interface/config';
import { DB_URL, DB_USERNAME, DB_PASSWORD } from '../../config';
import { FilesStorageUC } from './uc/files-storage.uc';

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

const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => {
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		return new NotFoundException(`The requested ${entityName}: ${where} has not been found.`);
	},
};
const imports = [AuthModule, CoreModule];
const providers = [
	FilesStorageUC,
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

@Module({
	imports: [
		...imports,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
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
	providers,
})
export class FilesStorageModule {}

@Module({
	imports: [...imports, MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions })],
	controllers: [FilesStorageController],
	providers,
})
export class FilesStorageTestModule {
	static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: FilesStorageTestModule,
			imports: [...imports, MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions, ...options })],
		};
	}
}
