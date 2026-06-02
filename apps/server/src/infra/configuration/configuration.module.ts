/* eslint-disable no-process-env */
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigModuleOptions, ConfigService } from '@nestjs/config';
import { ConfigurationFactory } from './configuration.factory';

const getNodeEnv = (): string => process.env.NODE_ENV || 'development';
// In NestJS ConfigModule, the first file in the array has highest priority.
// So we put .env.{NODE_ENV} first to allow environment-specific overrides.
const envFilesByPriority = [`.env.${getNodeEnv()}`, '.env'];
const loadEnvConfigInOrder = (): ConfigModuleOptions => {
	return {
		cache: true,
		envFilePath: envFilesByPriority,
		expandVariables: true,
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
