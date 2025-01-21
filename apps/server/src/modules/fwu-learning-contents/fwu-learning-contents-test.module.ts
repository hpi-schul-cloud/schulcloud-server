import { CoreModule } from '@core/core.module';
import { LoggerModule } from '@core/logger';
import { AuthGuardModule, AuthGuardOptions } from '@infra/auth-guard';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { MongoDatabaseModuleOptions } from '@infra/database/mongo-memory-database/types';
import { RabbitMQWrapperTestModule } from '@infra/rabbitmq';
import { S3ClientModule } from '@infra/s3-client';
import { AccountEntity } from '@modules/account/domain/entity/account.entity';
import { AuthorizationModule } from '@modules/authorization';
import { SystemEntity } from '@modules/system/entity';
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { Role, SchoolEntity, SchoolYearEntity, User } from '@shared/domain/entity';
import { FwuLearningContentsController } from './controller/fwu-learning-contents.controller';
import { config, s3Config } from './fwu-learning-contents.config';
import { FwuLearningContentsUc } from './uc/fwu-learning-contents.uc';

const imports = [
	MongoMemoryDatabaseModule.forRoot({
		entities: [User, AccountEntity, Role, SchoolEntity, SystemEntity, SchoolYearEntity],
	}),
	AuthorizationModule,
	ConfigModule.forRoot(createConfigModuleOptions(config)),
	HttpModule,
	CoreModule,
	LoggerModule,
	RabbitMQWrapperTestModule,
	S3ClientModule.register([s3Config]),
	AuthGuardModule.register([AuthGuardOptions.JWT]),
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
