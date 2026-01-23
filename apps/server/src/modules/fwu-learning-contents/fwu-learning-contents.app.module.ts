import { CoreModule } from '@core/core.module';
import { LoggerModule } from '@core/logger';
import { AuthGuardModule, AuthGuardOptions, JWT_AUTH_GUARD_CONFIG_TOKEN, JwtAuthGuardConfig } from '@infra/auth-guard';
import { S3ClientModule } from '@infra/s3-client';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { FwuLearningContentsController } from './controller/fwu-learning-contents.controller';
import { config, s3Config } from './fwu-learning-contents.config';
import { FwuLearningContentsUc } from './uc/fwu-learning-contents.uc';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
	imports: [
		CacheModule.register({
			ttl: 2538000, // 30 days
		}),
		CoreModule,
		LoggerModule,
		HttpModule,
		ConfigModule.forRoot(createConfigModuleOptions(config)),
		S3ClientModule.register([s3Config]),
		AuthGuardModule.register([
			{
				option: AuthGuardOptions.JWT,
				configInjectionToken: JWT_AUTH_GUARD_CONFIG_TOKEN,
				configConstructor: JwtAuthGuardConfig,
			},
		]),
	],
	controllers: [FwuLearningContentsController],
	providers: [
		FwuLearningContentsUc,
		{
			provide: APP_INTERCEPTOR,
			useClass: CacheInterceptor,
		},
	],
})
export class FwuLearningContentsModule {}
