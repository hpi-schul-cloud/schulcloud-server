import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { TIMEOUT_CONFIG_REGISTRY } from './timeout-config.registry';
import { TimeoutConfigValidator } from './timeout-config.validator';
import { TimeoutConfig } from './timeout-interceptor-config.interface';

describe('TimeoutConfigValidator', () => {
	let validator: TimeoutConfigValidator;
	let discoveryService: DeepMocked<DiscoveryService>;
	let metadataScanner: DeepMocked<MetadataScanner>;
	let reflector: DeepMocked<Reflector>;
	let processExitSpy: jest.SpyInstance;

	beforeEach(() => {
		discoveryService = createMock<DiscoveryService>();
		metadataScanner = createMock<MetadataScanner>();
		reflector = createMock<Reflector>();

		validator = new TimeoutConfigValidator(discoveryService, metadataScanner, reflector);

		// Suppress logger output during tests
		jest.spyOn(Logger.prototype, 'debug').mockImplementation();
		jest.spyOn(Logger.prototype, 'log').mockImplementation();
		jest.spyOn(Logger.prototype, 'warn').mockImplementation();
		jest.spyOn(Logger.prototype, 'error').mockImplementation();

		// Mock process.exit to prevent Jest worker from crashing
		processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('onApplicationBootstrap', () => {
		it('should call validateTimeoutConfigurations', () => {
			discoveryService.getControllers.mockReturnValue([]);

			validator.onApplicationBootstrap();

			expect(discoveryService.getControllers).toHaveBeenCalled();
		});
	});

	describe('validateTimeoutConfigurations', () => {
		describe('when no controllers use @RequestTimeout', () => {
			it('should pass validation silently', () => {
				discoveryService.getControllers.mockReturnValue([]);

				validator.onApplicationBootstrap();

				expect(processExitSpy).not.toHaveBeenCalled();
			});
		});

		describe('when timeout keys are properly registered', () => {
			it('should pass validation and log success', () => {
				const mockController = {
					instance: {
						constructor: class TestController {},
						testMethod: jest.fn(),
					},
				} as unknown as InstanceWrapper;

				discoveryService.getControllers.mockReturnValue([mockController]);
				metadataScanner.getAllMethodNames.mockReturnValue(['testMethod']);
				reflector.get.mockImplementation((key: unknown) => {
					if (key === 'requestTimeoutEnvironmentName') {
						// Return 'incomingRequestTimeout' which is always registered as default
						return 'incomingRequestTimeout';
					}
					return undefined;
				});

				const logSpy = jest.spyOn(Logger.prototype, 'log');

				validator.onApplicationBootstrap();

				expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('validation passed'));
				expect(processExitSpy).not.toHaveBeenCalled();
			});
		});

		describe('when timeout keys are NOT registered', () => {
			it('should log error and exit process with code 1', () => {
				const mockController = {
					instance: {
						constructor: class TestController {},
						testMethod: jest.fn(),
					},
				} as unknown as InstanceWrapper;

				discoveryService.getControllers.mockReturnValue([mockController]);
				metadataScanner.getAllMethodNames.mockReturnValue(['testMethod']);
				reflector.get.mockImplementation((key: unknown) => {
					if (key === 'requestTimeoutEnvironmentName') {
						return 'unregisteredTimeoutKey';
					}
					return undefined;
				});

				const errorSpy = jest.spyOn(Logger.prototype, 'error');

				validator.onApplicationBootstrap();

				expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('unregisteredTimeoutKey'));
				expect(processExitSpy).toHaveBeenCalledWith(1);
			});

			it('should list all missing keys in error message', () => {
				const mockController = {
					instance: {
						constructor: class TestController {},
						method1: jest.fn(),
						method2: jest.fn(),
					},
				} as unknown as InstanceWrapper;

				discoveryService.getControllers.mockReturnValue([mockController]);
				metadataScanner.getAllMethodNames.mockReturnValue(['method1', 'method2']);

				let callCount = 0;
				reflector.get.mockImplementation((key: unknown) => {
					if (key === 'requestTimeoutEnvironmentName') {
						callCount += 1;
						if (callCount === 2) return 'missingKey1';
						if (callCount === 3) return 'missingKey2';
					}
					return undefined;
				});

				const errorSpy = jest.spyOn(Logger.prototype, 'error');

				validator.onApplicationBootstrap();

				expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('missingKey1'));
				expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('missingKey2'));
				expect(processExitSpy).toHaveBeenCalledWith(1);
			});
		});
	});

	describe('extractUsedTimeoutKeys', () => {
		it('should extract class-level timeout keys', () => {
			const mockController = {
				instance: {
					constructor: class TestController {},
				},
			} as unknown as InstanceWrapper;

			discoveryService.getControllers.mockReturnValue([mockController]);
			metadataScanner.getAllMethodNames.mockReturnValue([]);
			reflector.get.mockImplementation((key: unknown, target: unknown) => {
				if (key === 'requestTimeoutEnvironmentName' && typeof target === 'function') {
					return 'classLevelTimeout';
				}
				return undefined;
			});

			// Use reflection to test private method indirectly through onApplicationBootstrap
			const debugSpy = jest.spyOn(Logger.prototype, 'debug');

			validator.onApplicationBootstrap();

			expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('classLevelTimeout'));
		});

		it('should extract method-level timeout keys', () => {
			const mockController = {
				instance: {
					constructor: class TestController {},
					handleRequest: jest.fn(),
				},
			} as unknown as InstanceWrapper;

			discoveryService.getControllers.mockReturnValue([mockController]);
			metadataScanner.getAllMethodNames.mockReturnValue(['handleRequest']);

			reflector.get.mockImplementation((key: unknown, target: unknown) => {
				if (key === 'requestTimeoutEnvironmentName') {
					// First call is for class, second is for method
					if (typeof target === 'function' && (target as { name?: string }).name !== 'TestController') {
						return 'methodLevelTimeout';
					}
				}
				return undefined;
			});

			const debugSpy = jest.spyOn(Logger.prototype, 'debug');

			validator.onApplicationBootstrap();

			expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('Used timeout keys'));
		});

		it('should skip controllers without instance', () => {
			const mockController = {
				instance: null,
			} as unknown as InstanceWrapper;

			discoveryService.getControllers.mockReturnValue([mockController]);

			validator.onApplicationBootstrap();

			expect(processExitSpy).not.toHaveBeenCalled();
		});

		it('should skip controllers without prototype', () => {
			const mockController = {
				instance: Object.create(null),
			} as unknown as InstanceWrapper;

			discoveryService.getControllers.mockReturnValue([mockController]);

			validator.onApplicationBootstrap();

			expect(processExitSpy).not.toHaveBeenCalled();
		});

		it('should deduplicate timeout keys', () => {
			const mockController1 = {
				instance: {
					constructor: class Controller1 {},
					method1: jest.fn(),
				},
			} as unknown as InstanceWrapper;

			const mockController2 = {
				instance: {
					constructor: class Controller2 {},
					method2: jest.fn(),
				},
			} as unknown as InstanceWrapper;

			discoveryService.getControllers.mockReturnValue([mockController1, mockController2]);
			metadataScanner.getAllMethodNames.mockReturnValue(['method1']);

			// Return same key for both controllers
			reflector.get.mockImplementation((key: unknown) => {
				if (key === 'requestTimeoutEnvironmentName') {
					return 'incomingRequestTimeout';
				}
				return undefined;
			});

			const logSpy = jest.spyOn(Logger.prototype, 'log');

			validator.onApplicationBootstrap();

			// Should log "1 timeout key(s)" not "2 timeout key(s)"
			expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('1 timeout key(s)'));
		});
	});

	describe('getRegisteredTimeoutKeys', () => {
		it('should always include incomingRequestTimeout as default key', () => {
			discoveryService.getControllers.mockReturnValue([]);

			const debugSpy = jest.spyOn(Logger.prototype, 'debug');

			validator.onApplicationBootstrap();

			expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('incomingRequestTimeout'));
		});

		it('should include keys from registered timeout configs', () => {
			// Register a mock config
			class MockTimeoutConfig extends TimeoutConfig {
				public incomingRequestTimeout = 30000;

				public customTimeout = 60000;
			}

			// Add __propertyAccessKeys metadata like @ConfigProperty would
			(MockTimeoutConfig.prototype as { __propertyAccessKeys?: Array<{ propertyKey: string }> }).__propertyAccessKeys =
				[{ propertyKey: 'incomingRequestTimeout' }, { propertyKey: 'customTimeout' }];

			TIMEOUT_CONFIG_REGISTRY.register('MOCK_CONFIG_FOR_VALIDATOR_TEST', MockTimeoutConfig);

			discoveryService.getControllers.mockReturnValue([]);

			const debugSpy = jest.spyOn(Logger.prototype, 'debug');

			validator.onApplicationBootstrap();

			expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('customTimeout'));
		});

		it('should skip symbol property keys', () => {
			// Register a mock config with a symbol key
			class MockTimeoutConfigWithSymbol extends TimeoutConfig {
				public incomingRequestTimeout = 30000;
			}

			const symbolKey = Symbol('symbolTimeout');

			// Add __propertyAccessKeys with a symbol key
			(
				MockTimeoutConfigWithSymbol.prototype as {
					__propertyAccessKeys?: Array<{ propertyKey: string | symbol }>;
				}
			).__propertyAccessKeys = [{ propertyKey: 'incomingRequestTimeout' }, { propertyKey: symbolKey }];

			TIMEOUT_CONFIG_REGISTRY.register('MOCK_CONFIG_WITH_SYMBOL_TEST', MockTimeoutConfigWithSymbol);

			discoveryService.getControllers.mockReturnValue([]);

			const debugSpy = jest.spyOn(Logger.prototype, 'debug');

			validator.onApplicationBootstrap();

			// Should only log string keys, not symbol keys
			expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('incomingRequestTimeout'));
			// Symbol keys should be silently skipped
			expect(processExitSpy).not.toHaveBeenCalled();
		});

		it('should log warning when config inspection fails', () => {
			// Register a mock config that will throw when iterating propertyAccessKeys
			class ProblematicConfig extends TimeoutConfig {
				public incomingRequestTimeout = 30000;
			}

			// Create a __propertyAccessKeys that throws when accessed
			const throwingArray = {
				forEach: () => {
					throw new Error('Cannot iterate');
				},
			};

			(ProblematicConfig.prototype as { __propertyAccessKeys?: unknown }).__propertyAccessKeys = throwingArray;

			TIMEOUT_CONFIG_REGISTRY.register('PROBLEMATIC_CONFIG_TEST', ProblematicConfig);

			discoveryService.getControllers.mockReturnValue([]);

			const warnSpy = jest.spyOn(Logger.prototype, 'warn');

			validator.onApplicationBootstrap();

			expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Could not inspect timeout config for token'));
			expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('PROBLEMATIC_CONFIG_TEST'));
		});

		it('should handle config without __propertyAccessKeys metadata', () => {
			// Register a mock config without __propertyAccessKeys (undefined)
			class ConfigWithoutMetadata extends TimeoutConfig {
				public incomingRequestTimeout = 30000;
			}

			// Explicitly ensure __propertyAccessKeys is undefined (fallback to [] will be used)
			(ConfigWithoutMetadata.prototype as { __propertyAccessKeys?: unknown }).__propertyAccessKeys = undefined;

			TIMEOUT_CONFIG_REGISTRY.register('CONFIG_WITHOUT_METADATA_TEST', ConfigWithoutMetadata);

			discoveryService.getControllers.mockReturnValue([]);

			validator.onApplicationBootstrap();

			// Should not fail - the fallback empty array should be used
			expect(processExitSpy).not.toHaveBeenCalled();
		});
	});
});
