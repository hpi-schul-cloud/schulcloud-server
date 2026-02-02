import { TimeoutConfig } from '@core/interceptor/timeout-interceptor-config';
import { ConfigurationModule } from '@infra/configuration';
import { ClassSerializerInterceptor, DynamicModule, Module } from '@nestjs/common';
import { APP_INTERCEPTOR, DiscoveryModule } from '@nestjs/core';
import { MergedTimeoutConfig } from './config-merger';
import { DEFAULT_TIMEOUT_CONFIG_TOKEN, DefaultTimeoutConfig } from './default-timeout.config';
import { TIMEOUT_CONFIG_REGISTRY } from './timeout-config.registry';
import { TimeoutConfigValidator } from './timeout-config.validator';
import { TimeoutInterceptor } from './timeout.interceptor';

/** *********************************************
 * Global Interceptor setup
 * **********************************************
 * Here, we globally apply
 * - validate input data using @ClassSerializerInterceptor
 * - set a timeout for requests using @TimeoutInterceptor
 */
export const MERGED_TIMEOUT_CONFIG_TOKEN = 'MERGED_TIMEOUT_CONFIG';

@Module({})
export class TimeoutInterceptorModule {
	public static forRoot(): DynamicModule {
		const registrations = TIMEOUT_CONFIG_REGISTRY.getRegistrations();
		const configModuleImports = [
			ConfigurationModule.register(DEFAULT_TIMEOUT_CONFIG_TOKEN, DefaultTimeoutConfig),
			...registrations.map((reg) => ConfigurationModule.register(reg.token, reg.configConstructor)),
		];

		return {
			module: TimeoutInterceptorModule,
			imports: [...configModuleImports, DiscoveryModule],
			providers: [
				{
					provide: APP_INTERCEPTOR,
					useClass: ClassSerializerInterceptor,
				},
				{
					provide: MERGED_TIMEOUT_CONFIG_TOKEN,
					useFactory: (defaultConfig: TimeoutConfig, ...configs: TimeoutConfig[]): MergedTimeoutConfig =>
						new MergedTimeoutConfig([defaultConfig, ...configs]),
					inject: [DEFAULT_TIMEOUT_CONFIG_TOKEN, ...registrations.map((reg) => reg.token)],
				},
				{
					provide: APP_INTERCEPTOR,
					useFactory: (mergedConfig: TimeoutConfig): TimeoutInterceptor => new TimeoutInterceptor(mergedConfig),
					inject: [MERGED_TIMEOUT_CONFIG_TOKEN],
				},
				TimeoutConfigValidator,
			],
		};
	}
}
