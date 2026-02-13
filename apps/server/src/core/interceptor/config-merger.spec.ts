import { MergedTimeoutConfig } from './config-merger';
import { TimeoutConfig } from './timeout-interceptor-config.interface';

describe('MergedTimeoutConfig', () => {
	describe('constructor', () => {
		it('should create an instance with empty configs array', () => {
			const merged = new MergedTimeoutConfig([]);

			expect(merged).toBeInstanceOf(MergedTimeoutConfig);
			expect(merged).toBeInstanceOf(TimeoutConfig);
		});

		it('should merge a single config', () => {
			const config: TimeoutConfig = {
				incomingRequestTimeout: 30000,
			};

			const merged = new MergedTimeoutConfig([config]);

			expect(merged.incomingRequestTimeout).toBe(30000);
		});

		it('should merge multiple configs with unique keys', () => {
			const config1: TimeoutConfig = {
				incomingRequestTimeout: 30000,
				customTimeout1: 10000,
			};

			const config2 = {
				customTimeout2: 20000,
			} as unknown as TimeoutConfig;

			const merged = new MergedTimeoutConfig([config1, config2]);

			expect(merged.incomingRequestTimeout).toBe(30000);
			expect(merged.customTimeout1).toBe(10000);
			expect(merged.customTimeout2).toBe(20000);
		});

		it('should preserve all unique keys from all configs', () => {
			const config1: TimeoutConfig = {
				incomingRequestTimeout: 30000,
				timeoutA: 1000,
			};

			const config2 = {
				timeoutB: 2000,
			} as unknown as TimeoutConfig;

			const config3 = {
				timeoutC: 3000,
			} as unknown as TimeoutConfig;

			const merged = new MergedTimeoutConfig([config1, config2, config3]);

			expect(merged.incomingRequestTimeout).toBe(30000);
			expect(merged.timeoutA).toBe(1000);
			expect(merged.timeoutB).toBe(2000);
			expect(merged.timeoutC).toBe(3000);
		});

		it('should handle configs with numeric values correctly', () => {
			const config: TimeoutConfig = {
				incomingRequestTimeout: 0,
				zeroTimeout: 0,
				largeTimeout: 999999999,
			};

			const merged = new MergedTimeoutConfig([config]);

			expect(merged.incomingRequestTimeout).toBe(0);
			expect(merged.zeroTimeout).toBe(0);
			expect(merged.largeTimeout).toBe(999999999);
		});

		it('should throw an error when duplicate keys are found across configs', () => {
			const config1: TimeoutConfig = {
				incomingRequestTimeout: 30000,
				duplicateKey: 10000,
			};

			const config2 = {
				duplicateKey: 20000,
			} as unknown as TimeoutConfig;

			expect(() => new MergedTimeoutConfig([config1, config2])).toThrow(
				"Duplicate timeout configuration key detected: 'duplicateKey'. Each timeout key must be unique across all configurations."
			);
		});
	});
});
