import { ValkeyMode } from '@infra/valkey-client';
import { AccountConfig } from '@modules/account';
import { Algorithm } from 'jsonwebtoken';

interface CacheConfig {
	SESSION_VALKEY__MODE: ValkeyMode;
	SESSION_VALKEY__URI?: string;
	SESSION_VALKEY__SENTINEL_NAME?: string;
	SESSION_VALKEY__SENTINEL_PASSWORD?: string;
	SESSION_VALKEY__SENTINEL_SERVICE_NAME?: string;
}

export type AuthCookieSameSiteType = 'lax' | 'strict' | 'none';

interface AuthCookieConfig {
	COOKIE__HTTP_ONLY: boolean;
	COOKIE__JWT_HTTP_ONLY: boolean;
	COOKIE__SAME_SITE: AuthCookieSameSiteType;
	COOKIE__SECURE: boolean;
	COOKIE__EXPIRES_SECONDS: number;
}

export interface AuthenticationConfig extends AccountConfig, CacheConfig, AuthCookieConfig {
	FEATURE_JWT_EXTENDED_TIMEOUT_ENABLED: boolean;
	JWT_PRIVATE_KEY: string;
	JWT_PUBLIC_KEY: string;
	JWT_SIGNING_ALGORITHM: Algorithm;
	JWT_LIFETIME: string;
	JWT_TIMEOUT_SECONDS: number;
	JWT_LIFETIME_SUPPORT_SECONDS: number;
	JWT_EXTENDED_TIMEOUT_SECONDS: number;
	SC_DOMAIN: string;
	LOGIN_BLOCK_TIME: number;
	FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED: boolean;
}

export const SESSION_VALKEY_CLIENT = 'SESSION_VALKEY_CLIENT';
