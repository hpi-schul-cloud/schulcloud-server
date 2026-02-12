import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean, IsEnum } from 'class-validator';

enum LogLevels {
	DEBUG = 'debug',
	INFO = 'info',
	NOTICE = 'notice',
	WARNING = 'warning',
	ERROR = 'error',
	CRITICAL = 'crit',
	ALERT = 'alert',
	EMERGENCY = 'emerg',
}

export const LOGGER_CONFIG_TOKEN = 'LOGGER_CONFIG_TOKEN';

@Configuration()
export class LoggerConfig {
	@ConfigProperty('NEST_LOG_LEVEL')
	@IsEnum(LogLevels)
	public nestLogLevel = LogLevels.NOTICE;

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
