import { DomainErrorHandler, ErrorModule } from '@core/error';
import { Logger, LoggerModule } from '@core/logger';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ValkeyClientModuleAsyncOptions } from './types';
import { ValkeyConfig } from './valkey.config';
import { VALKEY_CLIENT, VALKEY_CLIENT_OPTIONS } from './valkey.constants';
import { ValkeyFactory } from './valkey.factory';

@Module({})
export class ValkeyClientModule {
	public static register(config: ValkeyConfig): DynamicModule {
		const providers = [
			{
				provide: VALKEY_CLIENT,
				useFactory: (logger: Logger, domainErrorHandler: DomainErrorHandler) =>
					ValkeyFactory.build(config, logger, domainErrorHandler),
				inject: [Logger, DomainErrorHandler],
			},
		];

		return {
			module: ValkeyClientModule,
			imports: [LoggerModule, ErrorModule],
			providers: providers,
			exports: providers,
		};
	}

	public static registerAsync(options: ValkeyClientModuleAsyncOptions): DynamicModule {
		const providers = [
			{
				provide: VALKEY_CLIENT,
				useFactory: (logger: Logger, domainErrorHandler: DomainErrorHandler, config: ValkeyConfig) =>
					ValkeyFactory.build(config, logger, domainErrorHandler),
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
