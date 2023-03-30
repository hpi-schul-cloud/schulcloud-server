import { DynamicModule, Module } from '@nestjs/common';
import { Account, User, Role, School, System, SchoolYear } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { MongoDatabaseModuleOptions } from '@shared/infra/database/mongo-memory-database/types';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { S3Client } from '@aws-sdk/client-s3';
import { LoggerModule } from '@src/core/logger';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { AuthorizationModule } from '@src/modules/authorization';
import { s3Config, config } from './fwu-learning-contents.config';
import { FwuLearningContentsController } from './controller/fwu-learning-contents.controller';
import { FwuLearningContentsUc } from './uc/fwu-learning-contents.uc';
import { S3Config } from './interface/config';

const imports = [
	MongoMemoryDatabaseModule.forRoot({ entities: [User, Account, Role, School, System, SchoolYear] }),
	AuthorizationModule,
	AuthenticationModule,
	ConfigModule.forRoot(createConfigModuleOptions(config)),
	HttpModule,
	CoreModule,
	LoggerModule,
];
const controllers = [FwuLearningContentsController];
const providers = [
	FwuLearningContentsUc,
	{
		provide: 'FWU_S3_Client',
		useFactory: (configProvider: S3Config) =>
			new S3Client({
				region: configProvider.region,
				credentials: {
					accessKeyId: configProvider.accessKeyId,
					secretAccessKey: configProvider.secretAccessKey,
				},
				endpoint: configProvider.endpoint,
				forcePathStyle: true,
				tls: true,
			}),
		inject: ['S3_Config'],
	},
	{
		provide: 'S3_Config',
		useValue: s3Config,
	},
];
@Module({
	imports,
	controllers,
	providers,
})
export class FwuLearningContentsTestModule {
	static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: FwuLearningContentsTestModule,
			imports: [...imports, MongoMemoryDatabaseModule.forRoot({ ...options })],
			controllers,
			providers,
		};
	}
}
