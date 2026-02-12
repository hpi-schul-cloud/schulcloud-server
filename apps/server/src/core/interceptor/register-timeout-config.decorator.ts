import { TIMEOUT_CONFIG_REGISTRY } from './timeout-config.registry';

export function RegisterTimeoutConfig(token: string) {
	return function <T extends { new (...args: unknown[]): object }>(constructor: T): T {
		TIMEOUT_CONFIG_REGISTRY.register(token);

		return constructor;
	};
}
