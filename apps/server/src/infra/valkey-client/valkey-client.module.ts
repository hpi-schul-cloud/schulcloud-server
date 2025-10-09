import { DomainErrorHandler, ErrorModule } from '@core/error';
import { Logger, LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import type Valkey from 'iovalkey';
import { InMemoryClient } from './clients';
import { ValkeyClientModuleAsyncOptions } from './types';
import { InMemoryConfig, ValkeyConfig, ValkeyMode } from './valkey.config';
import { VALKEY_CLIENT_OPTIONS, VALKEY_CONFIG_TOKEN } from './valkey.constants';
import { ValkeyFactory } from './valkey.factory';

const createValkeyClient = (
	config: ValkeyConfig,
	logger: Logger,
	domainErrorHandler: DomainErrorHandler
): Promise<Valkey | InMemoryClient> => {
	logger.setContext(ValkeyClientModule.name);

	if (config.MODE === ValkeyMode.IN_MEMORY) {
		const inMemoryClientInstance = new InMemoryClient(logger);

		return Promise.resolve(inMemoryClientInstance);
	} else {
		const instance = ValkeyFactory.create(config, logger, domainErrorHandler);

		return instance;
	}
};

@Module({})
export class ValkeyClientModule {
	public static registerInMemory(injectionToken: string): DynamicModule {
		return this.register(injectionToken, InMemoryConfig);
	}

	public static register(injectionToken: string, configConstructor: new () => ValkeyConfig): DynamicModule {
		const providers = [
			{
				provide: injectionToken,
				useFactory: (logger: Logger, domainErrorHandler: DomainErrorHandler, config: ValkeyConfig) =>
					createValkeyClient(config, logger, domainErrorHandler),
				inject: [Logger, DomainErrorHandler, VALKEY_CONFIG_TOKEN],
			},
		];

		return {
			module: ValkeyClientModule,
			imports: [LoggerModule, ErrorModule, ConfigurationModule.register(VALKEY_CONFIG_TOKEN, configConstructor)],
			providers: providers,
			exports: providers,
		};
	}

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
