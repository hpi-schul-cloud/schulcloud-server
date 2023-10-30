import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Account } from '@shared/domain/entity/account.entity';
import { Role } from '@shared/domain/entity/role.entity';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { SchoolYearEntity } from '@shared/domain/entity/schoolyear.entity';
import { SystemEntity } from '@shared/domain/entity/system.entity';
import { User } from '@shared/domain/entity/user.entity';
import { MongoMemoryDatabaseModule } from '@shared/infra/database/mongo-memory-database/mongo-memory-database.module';
import { MongoDatabaseModuleOptions } from '@shared/infra/database/mongo-memory-database/types';
import { RabbitMQWrapperTestModule } from '@shared/infra/rabbitmq/rabbitmq.module';
import { S3ClientModule } from '@shared/infra/s3-client/s3-client.module';
import { createConfigModuleOptions } from '@src/config/config-module-options';
import { CoreModule } from '@src/core/core.module';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AuthenticationModule } from '../authentication/authentication.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { FwuLearningContentsController } from './controller/fwu-learning-contents.controller';
import { config, s3Config } from './fwu-learning-contents.config';
import { FwuLearningContentsUc } from './uc/fwu-learning-contents.uc';

const imports = [
	MongoMemoryDatabaseModule.forRoot({ entities: [User, Account, Role, SchoolEntity, SystemEntity, SchoolYearEntity] }),
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
