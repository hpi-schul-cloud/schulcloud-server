import { ConfigurationModule } from '@infra/configuration';
import { Module, Provider } from '@nestjs/common';
import { utilities, WinstonModule } from 'nest-winston';
import winston, { Logger as WinstonLogger } from 'winston';
import { AUDIT_LOGGER_PROVIDER, AuditLogger } from './audit-logger';
import { ErrorLogger } from './error-logger';
import { LegacyLogger } from './legacy-logger.service';
import { Logger } from './logger';
import { LOGGER_CONFIG_TOKEN, LoggerConfig } from './logger.config';

// Syslog levels as defined by RFC 5424 - matches winston.config.syslog.levels
const SyslogLevel = {
	EMERG: 'emerg',
	ALERT: 'alert',
	CRIT: 'crit',
	ERROR: 'error',
	WARNING: 'warning',
	NOTICE: 'notice',
	INFO: 'info',
	DEBUG: 'debug',
} as const;

// Runtime validation: ensures our const stays in sync with Winston's actual levels
Object.values(SyslogLevel).forEach((level) => {
	if (!(level in winston.config.syslog.levels)) {
		throw new Error(`SyslogLevel.${level} is not a valid winston syslog level`);
	}
});

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
