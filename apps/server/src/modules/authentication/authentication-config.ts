import { XApiKeyConfig } from '@infra/auth-guard';
import { AccountConfig } from '@modules/account';

export interface AuthenticationConfig extends AccountConfig, XApiKeyConfig {
	LOGIN_BLOCK_TIME: number;
}
