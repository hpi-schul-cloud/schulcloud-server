import { TIMEOUT_CONFIG_REGISTRY } from './timeout-config.registry';
import { TimeoutConfig } from './timeout-interceptor-config';

export function RegisterTimeoutConfig(token: string, configConstructor: new () => TimeoutConfig) {
	return function <T extends { new (...args: unknown[]): object }>(constructor: T): T {
		TIMEOUT_CONFIG_REGISTRY.register(token, configConstructor);

		return constructor;
	};
}
