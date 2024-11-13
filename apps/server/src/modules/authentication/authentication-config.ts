import { AccountConfig } from '@modules/account';
import { Algorithm } from 'jsonwebtoken';

export interface AuthenticationConfig extends AccountConfig {
	DISABLED_BRUTE_FORCE_CHECK: boolean;
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
