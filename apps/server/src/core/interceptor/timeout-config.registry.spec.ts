import { TIMEOUT_CONFIG_REGISTRY as OriginalRegistry } from './timeout-config.registry';

describe('TimeoutConfigRegistry', () => {
	describe('TIMEOUT_CONFIG_REGISTRY singleton', () => {
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
				const instance1 = TIMEOUT_CONFIG_REGISTRY;
				const instance2 = TIMEOUT_CONFIG_REGISTRY;

				expect(instance1).toBe(instance2);
			});
		});

		describe('register', () => {
			it('should register a new timeout config token', () => {
				const token = 'TEST_CONFIG_TOKEN';

				TIMEOUT_CONFIG_REGISTRY.register(token);

				const tokens = TIMEOUT_CONFIG_REGISTRY.getTokens();
				expect(tokens).toHaveLength(1);
				expect(tokens).toContain(token);
			});

			it('should register multiple different tokens', () => {
				const token1 = 'TEST_CONFIG_TOKEN_1';
				const token2 = 'TEST_CONFIG_TOKEN_2';

				TIMEOUT_CONFIG_REGISTRY.register(token1);
				TIMEOUT_CONFIG_REGISTRY.register(token2);

				const tokens = TIMEOUT_CONFIG_REGISTRY.getTokens();
				expect(tokens).toHaveLength(2);
				expect(tokens).toContain(token1);
				expect(tokens).toContain(token2);
			});

			it('should not register duplicate tokens', () => {
				const token = 'DUPLICATE_TOKEN';

				TIMEOUT_CONFIG_REGISTRY.register(token);
				TIMEOUT_CONFIG_REGISTRY.register(token);

				const tokens = TIMEOUT_CONFIG_REGISTRY.getTokens();
				expect(tokens).toHaveLength(1);
				expect(tokens).toContain(token);
			});

			it('should allow registering different tokens', () => {
				const token1 = 'TOKEN_A';
				const token2 = 'TOKEN_B';

				TIMEOUT_CONFIG_REGISTRY.register(token1);
				TIMEOUT_CONFIG_REGISTRY.register(token2);

				const tokens = TIMEOUT_CONFIG_REGISTRY.getTokens();
				expect(tokens).toHaveLength(2);
			});
		});

		describe('getTokens', () => {
			it('should return an empty array when no tokens are registered', () => {
				const tokens = TIMEOUT_CONFIG_REGISTRY.getTokens();

				expect(tokens).toEqual([]);
				expect(tokens).toHaveLength(0);
			});

			it('should return a copy of the tokens array', () => {
				const token = 'TEST_TOKEN';
				TIMEOUT_CONFIG_REGISTRY.register(token);

				const tokens1 = TIMEOUT_CONFIG_REGISTRY.getTokens();
				const tokens2 = TIMEOUT_CONFIG_REGISTRY.getTokens();

				// Should be equal in content
				expect(tokens1).toEqual(tokens2);
				// But not the same reference (it's a copy)
				expect(tokens1).not.toBe(tokens2);
			});

			it('should not allow external modification of internal tokens', () => {
				const token = 'IMMUTABLE_TEST_TOKEN';
				TIMEOUT_CONFIG_REGISTRY.register(token);

				const tokens = TIMEOUT_CONFIG_REGISTRY.getTokens();
				tokens.push('INJECTED_TOKEN');

				const freshTokens = TIMEOUT_CONFIG_REGISTRY.getTokens();
				expect(freshTokens).toHaveLength(1);
				expect(freshTokens[0]).toBe(token);
			});
		});
	});
});
