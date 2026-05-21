import { ConfigurationModule } from '@infra/configuration';
import { Module, Provider } from '@nestjs/common';
import { utilities, WinstonModule } from 'nest-winston';
import winston, { Logger as WinstonLogger } from 'winston';
import { AUDIT_LOGGER_PROVIDER, AuditLogger } from './audit-logger';
import { ErrorLogger } from './error-logger';
import { LegacyLogger } from './legacy-logger.service';
import { Logger } from './logger';
import { LOGGER_CONFIG_TOKEN, LoggerConfig, SyslogLevel } from './logger.config';

const winstonFormatter = (): winston.Logform.Format =>
	winston.format.combine(
		winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
		winston.format.ms(),
		utilities.format.nestLike()
	);

const createAuditLoggerProvider = (): Provider<WinstonLogger> => {
	return {
		provide: AUDIT_LOGGER_PROVIDER,
		useFactory: (): WinstonLogger =>
			winston.createLogger({
				levels: winston.config.syslog.levels,
				level: SyslogLevel.INFO,
				transports: [
					new winston.transports.Console({
						format: winstonFormatter(),
					}),
				],
			}),
	};
};

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
							format: winstonFormatter(),
						}),
					],
				};
			},
			inject: [LOGGER_CONFIG_TOKEN],
		}),
	],
	providers: [LegacyLogger, Logger, ErrorLogger, createAuditLoggerProvider(), AuditLogger],
	exports: [LegacyLogger, Logger, ErrorLogger, AuditLogger],
})
export class LoggerModule {}
