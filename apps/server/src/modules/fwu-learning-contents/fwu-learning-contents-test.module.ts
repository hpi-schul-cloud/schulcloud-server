import { CoreModule } from '@core/core.module';
import { LoggerModule } from '@core/logger';
import { AuthGuardModule, AuthGuardOptions } from '@infra/auth-guard';
import { RabbitMQWrapperTestModule } from '@infra/rabbitmq';
import { S3ClientModule } from '@infra/s3-client';
import { AuthorizationModule } from '@modules/authorization';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { FwuLearningContentsController } from './controller/fwu-learning-contents.controller';
import { config, s3Config } from './fwu-learning-contents.config';
import { TEST_ENTITIES } from './fwu.entity.imports';
import { FwuLearningContentsUc } from './uc/fwu-learning-contents.uc';

const imports = [
	MongoMemoryDatabaseModule.forRoot({
		entities: TEST_ENTITIES,
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
export class FwuLearningContentsTestModule {}
