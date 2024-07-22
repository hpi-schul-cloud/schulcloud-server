import { AccountConfig } from '@modules/account';
import { XApiKeyConfig } from './config';

export interface AuthenticationConfig extends AccountConfig, XApiKeyConfig {
	LOGIN_BLOCK_TIME: number;
}
