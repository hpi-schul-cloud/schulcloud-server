import { DynamicModule, Module } from '@nestjs/common';
import { ErrorModule } from './error';
import { TimeoutConfig, TimeoutInterceptorModule } from './interceptor';
import { LoggerModule } from './logger';
import { ValidationModule } from './validation';

/**
 * The core module configures the cross-functional application behaviour by customizing error handling providing and logging.
 * Overrides/Configures global APP_INTERCEPTOR, APP_PIPE, APP_GUARD, APP_FILTER
 */
@Module({})
export class CoreModule {
	public static register<T extends TimeoutConfig>(
		configInjectionToken: string,
		constructor: new () => T
	): DynamicModule {
		return {
			module: CoreModule,
			imports: [
				LoggerModule,
				ErrorModule,
				ValidationModule,
				TimeoutInterceptorModule.register(configInjectionToken, constructor),
			],
			exports: [LoggerModule, ErrorModule],
		};
	}
}
