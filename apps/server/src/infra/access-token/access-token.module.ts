import { ValkeyClientModule, ValkeyConfig } from '@infra/valkey-client';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ACCESS_TOKEN_VALKEY_CLIENT, AccessTokenConfig } from './access-token.config';
import { AccessTokenService } from './domain';

const createValkeyModuleOptions = (configService: ConfigService<AccessTokenConfig>): ValkeyConfig => {
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
