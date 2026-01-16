import { DomainErrorHandler, ErrorModule } from '@core/error';
import { Logger, LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { StorageClient, ValkeyClientModuleAsyncOptions, ValkeyClientModuleOptions } from './types';
import { IN_MEMORY_VALKEY_CLIENT_CONFIG, InMemoryConfig, ValkeyConfig } from './valkey.config';
import { VALKEY_CLIENT_OPTIONS } from './valkey.constants';
import { ValkeyFactory } from './valkey.factory';

const createValkeyClient = (
	config: ValkeyConfig,
	logger: Logger,
	domainErrorHandler: DomainErrorHandler
): Promise<StorageClient> => {
	logger.setContext(ValkeyClientModule.name);
	const instance = ValkeyFactory.build(config, logger, domainErrorHandler);

	return instance;
};

@Module({})
export class ValkeyClientModule {
	public static registerInMemory(clientInjectionToken: string): DynamicModule {
		return this.register({
			clientInjectionToken,
			configInjectionToken: IN_MEMORY_VALKEY_CLIENT_CONFIG,
			configConstructor: InMemoryConfig,
		});
	}

	public static register(options: ValkeyClientModuleOptions): DynamicModule {
		const { clientInjectionToken, configInjectionToken, configConstructor } = options;
		const providers = [
			{
				provide: clientInjectionToken,
				useFactory: (logger: Logger, domainErrorHandler: DomainErrorHandler, config: ValkeyConfig) =>
					createValkeyClient(config, logger, domainErrorHandler),
				inject: [Logger, DomainErrorHandler, configInjectionToken],
			},
		];

		return {
			module: ValkeyClientModule,
			imports: [LoggerModule, ErrorModule, ConfigurationModule.register(configInjectionToken, configConstructor)],
			providers: providers,
			exports: providers,
		};
	}
	// @TODO: Refactor to use only one of the register methods
	public static registerAsync(options: ValkeyClientModuleAsyncOptions): DynamicModule {
		const providers = [
			{
				provide: options.injectionToken,
				useFactory: (logger: Logger, domainErrorHandler: DomainErrorHandler, config: ValkeyConfig) =>
					createValkeyClient(config, logger, domainErrorHandler),
				inject: [Logger, DomainErrorHandler, VALKEY_CLIENT_OPTIONS],
			},
			ValkeyClientModule.createAsyncProviders(options),
		];

		return {
			module: ValkeyClientModule,
			imports: [LoggerModule, ErrorModule],
			providers: providers,
			exports: providers,
		};
	}

	private static createAsyncProviders(options: ValkeyClientModuleAsyncOptions): Provider {
		if (options.useFactory) {
			return {
				provide: VALKEY_CLIENT_OPTIONS,
				useFactory: options.useFactory,
				inject: options.inject || [],
			};
		} else {
			throw new Error('ValkeyClientModule: useFactory is required');
		}
	}
}
