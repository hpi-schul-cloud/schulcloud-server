import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module } from '@nestjs/common';
import { utilities, WinstonModule } from 'nest-winston';
import winston from 'winston';
import { ErrorLogger } from './error-logger';
import { LegacyLogger } from './legacy-logger.service';
import { Logger } from './logger';
import { LOGGER_CONFIG_TOKEN, LoggerConfig } from './logger.config';

const providers = [LegacyLogger, Logger, ErrorLogger];
const exportsArray = [LegacyLogger, Logger, ErrorLogger];

@Module({
	imports: [
		WinstonModule.forRootAsync({
			imports: [ConfigurationModule.register(LOGGER_CONFIG_TOKEN, LoggerConfig)],
			useFactory: (config: LoggerConfig) => {
				return {
					levels: winston.config.syslog.levels,
					level: config.nestLogLevel,
					exitOnError: config.exitOnError,
					transports: [
						new winston.transports.Console({
							handleExceptions: true,
							handleRejections: true,
							format: winston.format.combine(
								winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
								winston.format.ms(),
								utilities.format.nestLike()
							),
						}),
					],
				};
			},
			inject: [LOGGER_CONFIG_TOKEN],
		}),
	],
	providers,
	exports: exportsArray,
})
export class LoggerModule {
	public static register(configInjectionToken: string, configConstructor: new () => LoggerConfig): DynamicModule {
		return {
			module: LoggerModule,
			imports: [ConfigurationModule.register(configInjectionToken, configConstructor)],
			providers,
			exports: exportsArray,
		};
	}
}
