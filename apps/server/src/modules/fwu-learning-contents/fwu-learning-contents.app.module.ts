import { CoreModule } from '@core/core.module';
import { LoggerModule } from '@core/logger';
import { AuthGuardModule, AuthGuardOptions, JWT_AUTH_GUARD_CONFIG_TOKEN, JwtAuthGuardConfig } from '@infra/auth-guard';
import { ConfigurationModule } from '@infra/configuration';
import { S3ClientModule } from '@infra/s3-client';
import { HttpModule } from '@nestjs/axios';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { FwuLearningContentsController } from './controller/fwu-learning-contents.controller';
import { FWU_S3_CLIENT_CONFIG_TOKEN, FwuS3ClientConfig } from './fwu-s3-client.config';
import { FWU_PUBLIC_API_CONFIG_TOKEN, FwuPublicApiConfig } from './fwu.config';
import { FWU_S3_CLIENT_INJECTION_TOKEN } from './fwu.const';
import { FwuLearningContentsUc } from './uc/fwu-learning-contents.uc';
import {
	ValkeyClientModule,
	ValkeyClientSessionConfig,
	SESSION_VALKEY_CLIENT_CONFIG_TOKEN,
} from '@infra/valkey-client';
import { SESSION_VALKEY_CLIENT } from '@modules/authentication';

@Module({
	imports: [
		CacheModule.register({
			ttl: 2538000, // 30 days
		}),
		CoreModule,
		LoggerModule,
		HttpModule,
		ConfigurationModule.register(FWU_PUBLIC_API_CONFIG_TOKEN, FwuPublicApiConfig),
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
		ValkeyClientModule.register({
			clientInjectionToken: SESSION_VALKEY_CLIENT,
			configConstructor: ValkeyClientSessionConfig,
			configInjectionToken: SESSION_VALKEY_CLIENT_CONFIG_TOKEN,
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
