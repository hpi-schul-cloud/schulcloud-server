import { TimeoutConfig } from './timeout-interceptor-config.interface';

interface TimeoutConfigRegistration {
	token: string;
	configConstructor: new () => TimeoutConfig;
}

class TimeoutConfigRegistry {
	private static instance: TimeoutConfigRegistry;
	private registrations: TimeoutConfigRegistration[] = [];

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor() {}

	public static getInstance(): TimeoutConfigRegistry {
		if (!TimeoutConfigRegistry.instance) {
			TimeoutConfigRegistry.instance = new TimeoutConfigRegistry();
		}

		return TimeoutConfigRegistry.instance;
	}

	public register(token: string, configConstructor: new () => TimeoutConfig): void {
		// Check if already registered
		const exists = this.registrations.some((reg) => reg.token === token);
		if (!exists) {
			this.registrations.push({ token, configConstructor });
		}
	}

	public getRegistrations(): TimeoutConfigRegistration[] {
		return [...this.registrations];
	}
}

export const TIMEOUT_CONFIG_REGISTRY = TimeoutConfigRegistry.getInstance();
