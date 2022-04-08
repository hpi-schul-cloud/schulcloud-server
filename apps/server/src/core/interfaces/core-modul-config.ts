import { IInterceptorConfig } from '@shared/common';

// Add additional interfaces over extends Interface1, Interface2, ..
export interface ICoreModuleConfig extends IInterceptorConfig {
	INCOMING_REQUEST_TIMEOUT: number;
}
