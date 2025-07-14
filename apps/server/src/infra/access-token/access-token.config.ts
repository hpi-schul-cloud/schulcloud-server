import { ValkeyMode } from '@infra/valkey-client';

export interface AccessTokenConfig {
	SESSION_VALKEY__MODE: ValkeyMode;
	SESSION_VALKEY__URI?: string;
	SESSION_VALKEY__SENTINEL_NAME?: string;
	SESSION_VALKEY__SENTINEL_PASSWORD?: string;
	SESSION_VALKEY__SENTINEL_SERVICE_NAME?: string;
}

export const ACCESS_TOKEN_VALKEY_CLIENT = 'ACCESS_TOKEN_VALKEY_CLIENT';
