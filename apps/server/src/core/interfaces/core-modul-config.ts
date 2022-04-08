import { IInterceptorConfig } from '@shared/common';

export interface ICoreModuleConfig extends IInterceptorConfig {
	INCOMING_REQUEST_TIMEOUT: number;
}
