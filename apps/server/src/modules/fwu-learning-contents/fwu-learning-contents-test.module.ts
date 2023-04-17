import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Account, Role, School, SchoolYear, System, User } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { MongoDatabaseModuleOptions } from '@shared/infra/database/mongo-memory-database/types';
import { createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { AuthorizationModule } from '@src/modules/authorization';
import { S3ClientAdapter } from '../files-storage/client/s3-client.adapter';
import { FwuLearningContentsController } from './controller/fwu-learning-contents.controller';
import { config } from './fwu-learning-contents.config';
import { FwuLearningContentsUc } from './uc/fwu-learning-contents.uc';

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
const providers = [FwuLearningContentsUc, S3ClientAdapter];
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
