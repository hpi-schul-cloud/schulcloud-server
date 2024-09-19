import { XApiKeyConfig } from '@infra/auth-guard';
import { AccountConfig } from '@modules/account';

export interface AuthenticationConfig extends AccountConfig, XApiKeyConfig {
	AUTHENTICATION: string;
	DISABLED_BRUTE_FORCE_CHECK: boolean;
	FEATURE_JWT_EXTENDED_TIMEOUT_ENABLED: boolean;
	JWT_LIFETIME: string;
	JWT_TIMEOUT_SECONDS: number;
	JWT_LIFETIME_SUPPORT_SECONDS: number;
	JWT_EXTENDED_TIMEOUT_SECONDS: number;
	LOGIN_BLOCK_TIME: number;
}
