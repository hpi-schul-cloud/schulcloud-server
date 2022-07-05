import { S3Client } from '@aws-sdk/client-s3';
import { Configuration } from '@hpi-schul-cloud/commons';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { DynamicModule, Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ALL_ENTITIES } from '@shared/domain';
import { AntivirusModule } from '@shared/infra/antivirus/antivirus.module';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { MongoDatabaseModuleOptions } from '@shared/infra/database/mongo-memory-database/types';
import { RabbitMQWrapperModule, RabbitMQWrapperTestModule } from '@shared/infra/rabbitmq/rabbitmq.module';
import { FileRecordRepo } from '@shared/repo';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { CoreModule } from '@src/core';
import { Logger } from '@src/core/logger';
import { AuthModule } from '@src/modules/authentication/auth.module';
import { AuthorizationModule } from '../authorization';
import { S3ClientAdapter } from './client/s3-client.adapter';
import { FileSecurityController } from './controller/file-security.controller';
import { FilesStorageController } from './controller/files-storage.controller';
import fileStorageConfig from './files-storage.config';
import { S3Config } from './interface/config';
import { FileRecordUC } from './uc/file-record.uc';
import { FilesStorageUC } from './uc/files-storage.uc';

// The configurations lookup
// config/development.json for development
// config/test.json for tests
export const config: S3Config = {
	endpoint: Configuration.get('FILES_STORAGE__S3_ENDPOINT') as string,
	region: Configuration.get('FILES_STORAGE__S3_REGION') as string,
	bucket: Configuration.get('FILES_STORAGE__S3_BUCKET') as string,
	accessKeyId: Configuration.get('FILES_STORAGE__S3_ACCESS_KEY_ID') as string,
	secretAccessKey: Configuration.get('FILES_STORAGE__S3_SECRET_ACCESS_KEY') as string,
};

const imports = [
	ConfigModule.forRoot({
		isGlobal: true,
		load: [fileStorageConfig],
	}),
	AuthorizationModule,
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
	Logger,
];

const controllers = [FilesStorageController, FileSecurityController];

const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => {
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		return new NotFoundException(`The requested ${entityName}: ${where} has not been found.`);
	},
};

@Module({
	imports: [
		...imports,
		RabbitMQWrapperModule,
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
	controllers,
	providers,
})
export class FilesStorageModule {}

@Module({
	imports: [...imports, MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions }), RabbitMQWrapperTestModule],
	controllers,
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
