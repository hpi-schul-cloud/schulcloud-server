import { LogLevel } from '@nestjs/common';

export interface ILoggerConfig {
	LOG_LEVEL: string[] | LogLevel[];
}
