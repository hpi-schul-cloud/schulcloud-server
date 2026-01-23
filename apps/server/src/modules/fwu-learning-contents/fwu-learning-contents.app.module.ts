import { CoreModule } from '@core/core.module';
import { LoggerModule } from '@core/logger';
import { AuthGuardModule, AuthGuardOptions, JWT_AUTH_GUARD_CONFIG_TOKEN, JwtAuthGuardConfig } from '@infra/auth-guard';
import { S3ClientModule } from '@infra/s3-client';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { FwuLearningContentsController } from './controller/fwu-learning-contents.controller';
import { config } from './fwu-learning-contents.config';
import { FWU_S3_CLIENT_CONFIG_TOKEN, FwuS3ClientConfig } from './fwu-s3-client.config';
import { FWU_S3_CLIENT_INJECTION_TOKEN } from './fwu.const';
import { FwuLearningContentsUc } from './uc/fwu-learning-contents.uc';

@Module({
	imports: [
		CoreModule,
		LoggerModule,
		HttpModule,
		ConfigModule.forRoot(createConfigModuleOptions(config)),
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
	],
	controllers: [FwuLearningContentsController],
	providers: [FwuLearningContentsUc],
})
export class FwuLearningContentsModule {}
