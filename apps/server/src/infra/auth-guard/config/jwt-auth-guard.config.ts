import { ValkeyMode } from '@infra/valkey-client';
import { Algorithm } from 'jsonwebtoken';

export interface JwtAuthGuardConfig {
	JWT_PUBLIC_KEY: string;
	JWT_SIGNING_ALGORITHM: Algorithm;
	SC_DOMAIN: string;
	SESSION_VALKEY__MODE: ValkeyMode;
	SESSION_VALKEY__URI?: string;
	SESSION_VALKEY__SENTINEL_NAME?: string;
	SESSION_VALKEY__SENTINEL_PASSWORD?: string;
	SESSION_VALKEY__SENTINEL_SERVICE_NAME?: string;
}
