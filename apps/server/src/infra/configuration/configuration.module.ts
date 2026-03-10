/* eslint-disable no-process-env */
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigModuleOptions, ConfigService } from '@nestjs/config';
import { ConfigurationFactory } from './configuration.factory';

const getNodeEnv = (): string => process.env.NODE_ENV || 'development';
const envFilesHighestPriorityFirst = ['.env', `.env.${getNodeEnv()}`];
const loadEnvConfigInOrder = (): ConfigModuleOptions => {
	return {
		cache: true,
		envFilePath: envFilesHighestPriorityFirst,
	};
};

@Module({})
export class ConfigurationModule {
	public static register<T extends object>(
		configInjectionToken: string,
		configConstructor: new () => T
	): DynamicModule {
		return {
			imports: [ConfigModule.forRoot(loadEnvConfigInOrder())],
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
