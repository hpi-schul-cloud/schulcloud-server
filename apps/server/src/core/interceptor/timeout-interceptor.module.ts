import { ConfigurationModule } from '@infra/configuration';
import { ClassSerializerInterceptor, DynamicModule, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DEFAULT_TIMEOUT_CONFIG_TOKEN, DefaultTimeoutConfig } from './default-timeout.config';
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
	public static forRoot(): DynamicModule {
		return {
			module: TimeoutInterceptorModule,
			imports: [ConfigurationModule.register(DEFAULT_TIMEOUT_CONFIG_TOKEN, DefaultTimeoutConfig)],
			providers: [
				{
					provide: APP_INTERCEPTOR,
					useClass: ClassSerializerInterceptor,
				},
				{
					provide: APP_INTERCEPTOR,
					useClass: TimeoutInterceptor,
				},
			],
		};
	}
}
