/* eslint-disable no-process-env */
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigModuleOptions, ConfigService } from '@nestjs/config';
import { ConfigurationFactory } from './configuration.factory';

const getEnvConfig = (): ConfigModuleOptions => {
	const envConfig = {
		cache: true,
		envFilePath: '.env',
		ignoreEnvFile: false,
	};

	if (process.env.NODE_ENV === 'test') {
		envConfig.envFilePath = '.env.test';
	}

	if (process.env.NODE_ENV === 'production') {
		envConfig.ignoreEnvFile = true;
	}

	return envConfig;
};

@Module({})
export class ConfigurationModule {
	public static register<T extends object>(
		configInjectionToken: string,
		configConstructor: new () => T
	): DynamicModule {
		return {
			imports: [ConfigModule.forRoot(getEnvConfig())],
			providers: [
				{
					provide: configInjectionToken,
					useFactory: (configService: ConfigService): T => {
						const factory = new ConfigurationFactory(configService);
						const config = factory.loadAndValidateConfigs(configConstructor);

						return config;
					},
					inject: [ConfigService],
				},
			],
			exports: [configInjectionToken],
			module: ConfigurationModule,
		};
	}
}
