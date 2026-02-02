import { TimeoutConfig } from '@core/interceptor/timeout-interceptor-config';
import { ConfigurationModule } from '@infra/configuration';
import { ClassSerializerInterceptor, DynamicModule, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TimeoutInterceptor } from './timeout.interceptor';

/** *********************************************
 * Global Interceptor setup
 * **********************************************
 * Here, we globally apply
 * - validate input data using @ClassSerializerInterceptor
 * - set a timeout for requests using @TimeoutInterceptor
 */
@Module({})
export class TimeoutInterceptorModule {
	public static register<T extends TimeoutConfig>(
		configInjectionToken: string,
		configConstructor: new () => T
	): DynamicModule {
		return {
			module: TimeoutInterceptorModule,
			imports: [ConfigurationModule.register(configInjectionToken, configConstructor)],
			providers: [
				{
					provide: APP_INTERCEPTOR,
					useClass: ClassSerializerInterceptor,
				},
				{
					provide: APP_INTERCEPTOR,
					useFactory: (config: TimeoutConfig): TimeoutInterceptor => new TimeoutInterceptor(config),
					inject: [configInjectionToken],
				},
			],
		};
	}
}
