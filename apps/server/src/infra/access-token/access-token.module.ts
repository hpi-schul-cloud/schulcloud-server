import { ValkeyClientModule, ValkeyConfig } from '@infra/valkey-client';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ACCESS_TOKEN_VALKEY_CLIENT, AccessTokenConfig } from './access-token.config';
import { AccessTokenService } from './domain';

const createValkeyModuleOptions = (configService: ConfigService<AccessTokenConfig>): ValkeyConfig => {
	const config = {
		mode: configService.getOrThrow('SESSION_VALKEY__MODE', { infer: true }),
		uri: configService.get('SESSION_VALKEY__URI', { infer: true }),
		sentinelName: configService.get('SESSION_VALKEY__SENTINEL_NAME', { infer: true }),
		sentinelPassword: configService.get('SESSION_VALKEY__SENTINEL_PASSWORD', { infer: true }),
		sentinelServiceName: configService.get('SESSION_VALKEY__SENTINEL_SERVICE_NAME', { infer: true }),
	};

	return config;
};

@Module({
	imports: [
		ValkeyClientModule.registerAsync({
			injectionToken: ACCESS_TOKEN_VALKEY_CLIENT,
			useFactory: createValkeyModuleOptions,
			inject: [ConfigService],
		}),
	],
	providers: [AccessTokenService],
	exports: [AccessTokenService],
})
export class AccessTokenModule {}
