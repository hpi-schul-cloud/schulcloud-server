import { ConfigurationModule } from '@infra/configuration';
import { DomainErrorHandler, ErrorModule } from '@infra/error';
import { Logger, LoggerModule } from '@infra/logger';
import { DynamicModule, Module } from '@nestjs/common';
import { StorageClient, ValkeyClientModuleOptions } from './types';
import { IN_MEMORY_VALKEY_CLIENT_CONFIG, InMemoryConfig, ValkeyConfig } from './valkey.config';
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
				useFactory: (
					logger: Logger,
					domainErrorHandler: DomainErrorHandler,
					config: ValkeyConfig
				): Promise<StorageClient> => createValkeyClient(config, logger, domainErrorHandler),
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
}
