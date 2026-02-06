import { CoreModule } from '@core/core.module';
import { LoggerModule } from '@core/logger';
import { AuthGuardModule, AuthGuardOptions } from '@infra/auth-guard';
import { S3ClientModule } from '@infra/s3-client';
import { ValkeyClientModule, ValkeyConfig } from '@infra/valkey-client';
import { SESSION_VALKEY_CLIENT } from '@modules/authentication/authentication-config';
import { HttpModule } from '@nestjs/axios';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { FwuLearningContentsController } from './controller/fwu-learning-contents.controller';
import { config, FwuLearningContentsConfig, s3Config } from './fwu-learning-contents.config';
import { FwuLearningContentsUc } from './uc/fwu-learning-contents.uc';

const createValkeyModuleOptions = (configService: ConfigService<FwuLearningContentsConfig>): ValkeyConfig => {
	const config = {
		MODE: configService.getOrThrow('SESSION_VALKEY__MODE', { infer: true }),
		URI: configService.get('SESSION_VALKEY__URI', { infer: true }),
		SENTINEL_NAME: configService.get('SESSION_VALKEY__SENTINEL_NAME', { infer: true }),
		SENTINEL_PASSWORD: configService.get('SESSION_VALKEY__SENTINEL_PASSWORD', { infer: true }),
		SENTINEL_SERVICE_NAME: configService.get('SESSION_VALKEY__SENTINEL_SERVICE_NAME', { infer: true }),
	};

	return config;
};

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
		AuthGuardModule.register([AuthGuardOptions.JWT]),
		ValkeyClientModule.registerAsync({
			injectionToken: SESSION_VALKEY_CLIENT,
			useFactory: createValkeyModuleOptions,
			inject: [ConfigService],
		}),
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
