import { ConfigurationModule } from '@infra/configuration';
import { Module, Provider } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import winston, { Logger as WinstonLogger } from 'winston';
import { AUDIT_LOGGER_PROVIDER, AuditLogger } from './audit-logger';
import { LegacyLogger } from './legacy-logger.service';
import { createLogFormat } from './log-format';
import { createLevelFilter, getMostVerboseLevel, parseLogLevels } from './log-levels';
import { Logger } from './logger';
import { LOGGER_CONFIG_TOKEN, LoggerConfig, SyslogLevel } from './logger.config';

const createAuditLoggerProvider = (): Provider<WinstonLogger> => {
	return {
		provide: AUDIT_LOGGER_PROVIDER,
		useFactory: (config: LoggerConfig): WinstonLogger =>
			winston.createLogger({
				levels: winston.config.syslog.levels,
				level: SyslogLevel.INFO,
				transports: [
					new winston.transports.Console({
						format: createLogFormat(config.logFormat),
					}),
				],
			}),
		inject: [LOGGER_CONFIG_TOKEN],
	};
};

@Module({
	imports: [
		ConfigurationModule.register(LOGGER_CONFIG_TOKEN, LoggerConfig),
		WinstonModule.forRootAsync({
			imports: [ConfigurationModule.register(LOGGER_CONFIG_TOKEN, LoggerConfig)],
			useFactory: (config: LoggerConfig) => {
				const logLevels = parseLogLevels(config.logLevels, config.nestLogLevel);

				return {
					levels: winston.config.syslog.levels,
					// winston lets everything through that any module may log, the level filter decides per entry
					level: getMostVerboseLevel(logLevels),
					exitOnError: config.exitOnError,
					transports: [
						new winston.transports.Console({
							handleExceptions: true,
							handleRejections: true,
							format: winston.format.combine(createLevelFilter(logLevels), createLogFormat(config.logFormat)),
						}),
					],
				};
			},
			inject: [LOGGER_CONFIG_TOKEN],
		}),
	],
	providers: [LegacyLogger, Logger, createAuditLoggerProvider(), AuditLogger],
	exports: [LegacyLogger, Logger, AuditLogger],
})
export class LoggerModule {}
