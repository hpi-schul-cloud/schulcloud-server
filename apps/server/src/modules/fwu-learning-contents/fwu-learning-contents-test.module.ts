import { CoreModule } from '@core/core.module';
import { LoggerModule } from '@core/logger';
import { AuthGuardModule, AuthGuardOptions, JWT_AUTH_GUARD_CONFIG_TOKEN, JwtAuthGuardConfig } from '@infra/auth-guard';
import { ConfigurationModule } from '@infra/configuration';
import { S3ClientModule } from '@infra/s3-client';
import { AuthorizationModule } from '@modules/authorization';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { FwuLearningContentsController } from './controller/fwu-learning-contents.controller';
import { FWU_S3_CLIENT_CONFIG_TOKEN, FwuS3ClientConfig } from './fwu-s3-client.config';
import { FWU_PUBLIC_API_CONFIG_TOKEN, FwuPublicApiConfig } from './fwu.config';
import { FWU_S3_CLIENT_INJECTION_TOKEN } from './fwu.const';
import { TEST_ENTITIES } from './fwu.entity.imports';
import { FwuLearningContentsUc } from './uc/fwu-learning-contents.uc';

const imports = [
	MongoMemoryDatabaseModule.forRoot({
		entities: TEST_ENTITIES,
	}),
	AuthorizationModule,
	ConfigurationModule.register(FWU_PUBLIC_API_CONFIG_TOKEN, FwuPublicApiConfig),
	HttpModule,
	CoreModule,
	LoggerModule,
	S3ClientModule.register({
		clientInjectionToken: FWU_S3_CLIENT_INJECTION_TOKEN,
		configInjectionToken: FWU_S3_CLIENT_CONFIG_TOKEN,
		configConstructor: FwuS3ClientConfig,
	}),
	AuthGuardModule.register([
		{
			option: AuthGuardOptions.JWT,
			configInjectionToken: JWT_AUTH_GUARD_CONFIG_TOKEN,
			configConstructor: JwtAuthGuardConfig,
		},
	]),
];
const controllers = [FwuLearningContentsController];
const providers = [FwuLearningContentsUc];
@Module({
	imports,
	controllers,
	providers,
})
export class FwuLearningContentsTestModule {}
