import { AvailableLogLevel } from './logger.interface';

export interface ILoggerConfig {
	AVAILABLE_LOG_LEVELS: AvailableLogLevel[];
	LOG_LEVEL: string;
}
