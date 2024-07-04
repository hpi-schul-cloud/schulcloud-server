import { MongoMemoryDatabaseModule } from '@infra/database';
import { MongoDatabaseModuleOptions } from '@infra/database/mongo-memory-database/types';
import { RabbitMQWrapperTestModule } from '@infra/rabbitmq';
import { S3ClientModule } from '@infra/s3-client';
import { AccountEntity } from '@src/modules/account/domain/entity/account.entity';
import { AuthenticationModule } from '@modules/authentication/authentication.module';
import { AuthorizationModule } from '@modules/authorization';
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Role, SchoolEntity, SchoolYearEntity, SystemEntity, User } from '@shared/domain/entity';
import { createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { FwuLearningContentsUc } from './uc/fwu-learning-contents.uc';
import { FwuLearningContentsController } from './controller/fwu-learning-contents.controller';
import { config, s3Config } from './fwu-learning-contents.config';

const imports = [
	MongoMemoryDatabaseModule.forRoot({
		entities: [User, AccountEntity, Role, SchoolEntity, SystemEntity, SchoolYearEntity],
	}),
	AuthorizationModule,
	AuthenticationModule,
	ConfigModule.forRoot(createConfigModuleOptions(config)),
	HttpModule,
	CoreModule,
	LoggerModule,
	RabbitMQWrapperTestModule,
	S3ClientModule.register([s3Config]),
];
const controllers = [FwuLearningContentsController];
const providers = [FwuLearningContentsUc];
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
