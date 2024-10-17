import { XApiKeyConfig } from '@infra/auth-guard';
import { AccountConfig } from '@modules/account';

export interface AuthenticationConfig extends AccountConfig, XApiKeyConfig {
	DISABLED_BRUTE_FORCE_CHECK: boolean;
	FEATURE_JWT_EXTENDED_TIMEOUT_ENABLED: boolean;
	JWT_PRIVATE_KEY: string;
	JWT_PUBLIC_KEY: string;
	JWT_LIFETIME: string;
	JWT_TIMEOUT_SECONDS: number;
	JWT_LIFETIME_SUPPORT_SECONDS: number;
	JWT_EXTENDED_TIMEOUT_SECONDS: number;
	LOGIN_BLOCK_TIME: number;
}
