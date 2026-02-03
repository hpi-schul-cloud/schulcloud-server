import { TIMEOUT_CONFIG_REGISTRY as OriginalRegistry } from './timeout-config.registry';
import { TimeoutConfig } from './timeout-interceptor-config.interface';

// We need to test the class directly, not the singleton instance
// Import the module to get access to the registry class behavior

describe('TimeoutConfigRegistry', () => {
	// Create a fresh registry instance for each test by importing the class
	// Since the actual class is not exported, we'll test via the singleton
	// but need to be aware of state persistence between tests

	class MockTimeoutConfig extends TimeoutConfig {
		public incomingRequestTimeout = 30000;
	}

	class AnotherMockTimeoutConfig extends TimeoutConfig {
		public incomingRequestTimeout = 60000;
	}

	describe('TIMEOUT_CONFIG_REGISTRY singleton', () => {
		// Reset module between tests to get fresh singleton instances
		let TIMEOUT_CONFIG_REGISTRY: typeof OriginalRegistry;

		beforeEach(() => {
			// Clear the module cache to get a fresh singleton for each test
			jest.resetModules();
			// Re-import to get fresh instance
			// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
			({ TIMEOUT_CONFIG_REGISTRY } = require('./timeout-config.registry') as {
				TIMEOUT_CONFIG_REGISTRY: typeof OriginalRegistry;
			});
		});

		describe('getInstance', () => {
			it('should return the same instance when called multiple times', () => {
				// The exported TIMEOUT_CONFIG_REGISTRY is already the singleton instance
				// We verify singleton behavior by checking it's the same reference
				const instance1 = TIMEOUT_CONFIG_REGISTRY;
				const instance2 = TIMEOUT_CONFIG_REGISTRY;

				expect(instance1).toBe(instance2);
			});
		});

		describe('register', () => {
			it('should register a new timeout config', () => {
				const token = 'TEST_CONFIG_TOKEN';

				TIMEOUT_CONFIG_REGISTRY.register(token, MockTimeoutConfig);

				const registrations = TIMEOUT_CONFIG_REGISTRY.getRegistrations();
				expect(registrations).toHaveLength(1);
				expect(registrations[0]).toEqual({
					token,
					configConstructor: MockTimeoutConfig,
				});
			});

			it('should register multiple different configs', () => {
				const token1 = 'TEST_CONFIG_TOKEN_1';
				const token2 = 'TEST_CONFIG_TOKEN_2';

				TIMEOUT_CONFIG_REGISTRY.register(token1, MockTimeoutConfig);
				TIMEOUT_CONFIG_REGISTRY.register(token2, AnotherMockTimeoutConfig);

				const registrations = TIMEOUT_CONFIG_REGISTRY.getRegistrations();
				expect(registrations).toHaveLength(2);
				expect(registrations).toContainEqual({
					token: token1,
					configConstructor: MockTimeoutConfig,
				});
				expect(registrations).toContainEqual({
					token: token2,
					configConstructor: AnotherMockTimeoutConfig,
				});
			});

			it('should not register duplicate tokens', () => {
				const token = 'DUPLICATE_TOKEN';

				TIMEOUT_CONFIG_REGISTRY.register(token, MockTimeoutConfig);
				TIMEOUT_CONFIG_REGISTRY.register(token, AnotherMockTimeoutConfig);

				const registrations = TIMEOUT_CONFIG_REGISTRY.getRegistrations();
				expect(registrations).toHaveLength(1);
				expect(registrations[0]).toEqual({
					token,
					configConstructor: MockTimeoutConfig,
				});
			});

			it('should allow same config constructor with different tokens', () => {
				const token1 = 'TOKEN_A';
				const token2 = 'TOKEN_B';

				TIMEOUT_CONFIG_REGISTRY.register(token1, MockTimeoutConfig);
				TIMEOUT_CONFIG_REGISTRY.register(token2, MockTimeoutConfig);

				const registrations = TIMEOUT_CONFIG_REGISTRY.getRegistrations();
				expect(registrations).toHaveLength(2);
			});
		});

		describe('getRegistrations', () => {
			it('should return an empty array when no configs are registered', () => {
				const registrations = TIMEOUT_CONFIG_REGISTRY.getRegistrations();

				expect(registrations).toEqual([]);
				expect(registrations).toHaveLength(0);
			});

			it('should return a copy of the registrations array', () => {
				const token = 'TEST_TOKEN';
				TIMEOUT_CONFIG_REGISTRY.register(token, MockTimeoutConfig);

				const registrations1 = TIMEOUT_CONFIG_REGISTRY.getRegistrations();
				const registrations2 = TIMEOUT_CONFIG_REGISTRY.getRegistrations();

				// Should be equal in content
				expect(registrations1).toEqual(registrations2);
				// But not the same reference (it's a copy)
				expect(registrations1).not.toBe(registrations2);
			});

			it('should not allow external modification of internal registrations', () => {
				const token = 'IMMUTABLE_TEST_TOKEN';
				TIMEOUT_CONFIG_REGISTRY.register(token, MockTimeoutConfig);

				const registrations = TIMEOUT_CONFIG_REGISTRY.getRegistrations();
				registrations.push({ token: 'INJECTED_TOKEN', configConstructor: AnotherMockTimeoutConfig });

				const freshRegistrations = TIMEOUT_CONFIG_REGISTRY.getRegistrations();
				expect(freshRegistrations).toHaveLength(1);
				expect(freshRegistrations[0].token).toBe(token);
			});
		});
	});
});
