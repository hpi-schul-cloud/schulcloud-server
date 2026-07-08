/* eslint-disable no-process-env */
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigModuleOptions, ConfigService } from '@nestjs/config';
import { ConfigurationFactory } from './configuration.factory';

const getNodeEnv = (): string => process.env.NODE_ENV || 'development';
// The order of the env files is important, as the first file that is found will be used.
// The default .env file should be loaded first because it is in legacy server so implemented,
// and then the environment-specific file should be loaded second.
// This allows for environment-specific overrides of the default configuration.
// .env is not committed to version control, so it can be used for local development and testing.
const envFilesByPriority = ['.env', `.env.${getNodeEnv()}`];
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
