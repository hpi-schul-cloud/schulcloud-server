import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { TIMEOUT_CONFIG_REGISTRY } from './timeout-config.registry';

/**
 * Validates that all timeout keys used in @RequestTimeout decorators
 * are actually registered in the timeout configuration.
 * This runs on application startup to catch configuration errors early.
 */
@Injectable()
export class TimeoutConfigValidator implements OnApplicationBootstrap {
	private readonly logger = new Logger(TimeoutConfigValidator.name);

	constructor(
		private readonly discoveryService: DiscoveryService,
		private readonly metadataScanner: MetadataScanner,
		private readonly reflector: Reflector
	) {}

	public onApplicationBootstrap(): void {
		this.logger.debug('Starting timeout configuration validation...');
		this.validateTimeoutConfigurations();
	}

	private validateTimeoutConfigurations(): void {
		const controllers = this.discoveryService.getControllers();
		const usedTimeoutKeys = this.extractUsedTimeoutKeys(controllers);
		const registeredKeys = this.getRegisteredTimeoutKeys();

		this.logger.debug(`Used timeout keys: ${usedTimeoutKeys.join(', ')}`);
		this.logger.debug(`Registered timeout keys: ${registeredKeys.join(', ')}`);

		const missingKeys = usedTimeoutKeys.filter((key) => !registeredKeys.includes(key));

		if (missingKeys.length > 0) {
			const errorMessage =
				`Timeout configuration validation failed!\n` +
				`The following timeout keys are used in @RequestTimeout decorators but are NOT registered in any TimeoutConfig:\n` +
				missingKeys.map((key) => `  - ${key}`).join('\n') +
				`\n\nPlease ensure that these keys are:\n` +
				`  1. Defined as properties in a TimeoutConfig class\n` +
				`  2. The TimeoutConfig is registered using @RegisterTimeoutConfig decorator on the module\n` +
				`  3. The environment variable is properly configured`;

			this.logger.error(errorMessage);
			this.logger.error('Application startup aborted due to invalid timeout configuration.');
			process.exit(1);
		}

		if (usedTimeoutKeys.length > 0) {
			this.logger.log(
				`✓ Timeout configuration validation passed. All ${usedTimeoutKeys.length} timeout key(s) are properly registered.`
			);
		}
	}

	private extractUsedTimeoutKeys(controllers: InstanceWrapper[]): string[] {
		const timeoutKeys = new Set<string>();

		controllers.forEach((wrapper) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const { instance } = wrapper;
			if (!instance || !Object.getPrototypeOf(instance)) {
				return;
			}

			// Check class-level decorator
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
			const classTimeoutKey = this.reflector.get<string>('requestTimeoutEnvironmentName', instance.constructor);
			if (classTimeoutKey) {
				timeoutKeys.add(classTimeoutKey);
			}

			// Check method-level decorators
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const prototype = Object.getPrototypeOf(instance);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			const methodNames = this.metadataScanner.getAllMethodNames(prototype);

			methodNames.forEach((methodName) => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
				const method = prototype[methodName];
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				const methodTimeoutKey = this.reflector.get<string>('requestTimeoutEnvironmentName', method);
				if (methodTimeoutKey) {
					timeoutKeys.add(methodTimeoutKey);
				}
			});
		});

		return Array.from(timeoutKeys);
	}

	private getRegisteredTimeoutKeys(): string[] {
		const keys = new Set<string>();
		const registrations = TIMEOUT_CONFIG_REGISTRY.getRegistrations();

		this.logger.debug(`Found ${registrations.length} timeout config registrations`);

		// Add the default key from base class
		keys.add('incomingRequestTimeout');

		// Get keys from all registered config classes
		registrations.forEach((registration) => {
			try {
				// Access the __propertyAccessKeys metadata set by @ConfigProperty decorator
				const configClass = registration.configConstructor;
				const proto = configClass.prototype as { __propertyAccessKeys?: Array<{ propertyKey: string | symbol; key?: string | symbol }> };
				const propertyAccessKeys = proto.__propertyAccessKeys || [];

				// Add all property keys from the config class
				propertyAccessKeys.forEach((item) => {
					const key = item.propertyKey;
					if (typeof key === 'string') {
						keys.add(key);
						this.logger.debug(`Found property key: ${key} in ${registration.token}`);
					}
				});
			} catch (error) {
				this.logger.warn(`Could not inspect timeout config for token: ${registration.token}`);
			}
		});

		const keysArray = Array.from(keys);
		this.logger.debug(`Registered timeout keys found: ${keysArray.join(', ')}`);

		return keysArray;
	}
}
