import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, Matches } from 'class-validator';

// Syslog levels as defined by RFC 5424 - matches winston.config.syslog.levels
export enum SyslogLevel {
	DEBUG = 'debug',
	INFO = 'info',
	NOTICE = 'notice',
	WARNING = 'warning',
	ERROR = 'error',
	CRITICAL = 'crit',
	ALERT = 'alert',
	EMERGENCY = 'emerg',
}

export enum LogFormat {
	JSON = 'json',
	PRETTY = 'pretty',
}

export const LOGGER_CONFIG_TOKEN = 'LOGGER_CONFIG_TOKEN';

const levelNames = Object.values(SyslogLevel).join('|');
const levelRule = String.raw`\s*[\w.-]+\s*=\s*(${levelNames})\s*`;
const LOG_LEVELS_PATTERN = new RegExp(`^(${levelRule}(,${levelRule})*)?$`);

@Configuration()
export class LoggerConfig {
	@ConfigProperty('NEST_LOG_LEVEL')
	@IsEnum(SyslogLevel)
	public nestLogLevel = SyslogLevel.NOTICE;

	/**
	 * Log levels per module or class, e.g. "default=notice,BoardModule=debug,BoardService=warning".
	 * A class rule wins over a module rule. Without a default, NEST_LOG_LEVEL applies.
	 */
	@ConfigProperty('LOG_LEVELS')
	@IsOptional()
	@IsString()
	@Matches(LOG_LEVELS_PATTERN, {
		message: `LOG_LEVELS must look like "default=notice,BoardModule=debug", allowed levels: ${levelNames.replaceAll('|', ', ')}`,
	})
	public logLevels?: string;

	/**
	 * json: one JSON object per line, for deployments and log collection.
	 * pretty: human readable output for local development.
	 */
	@ConfigProperty('LOG_FORMAT')
	@IsEnum(LogFormat)
	public logFormat = LogFormat.JSON;

	/**
	 * By default, the application is terminated after an uncaughtException has been logged.
	 * If this is not the desired behavior, set exitOnError to false."
	 */
	@ConfigProperty('EXIT_ON_ERROR')
	@StringToBoolean()
	@IsBoolean()
	public exitOnError = true;

	@ConfigProperty('REQUEST_LOG_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public requestLogEnabled = false;
}
