import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { utilities, WinstonModule } from 'nest-winston';
import winston from 'winston';
import { ErrorLogger } from './error-logger';
import { LoggerConfig } from './logger.config';
import { LegacyLogger } from './legacy-logger.service';
import { Logger } from './logger';

@Module({
	imports: [
		WinstonModule.forRootAsync({
			useFactory: (configService: ConfigService<LoggerConfig, true>) => {
				return {
					levels: winston.config.syslog.levels,
					level: configService.get<string>('NEST_LOG_LEVEL'),
					exitOnError: configService.get<boolean>('EXIT_ON_ERROR'),
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
			inject: [ConfigService],
		}),
	],
	providers: [LegacyLogger, Logger, ErrorLogger],
	exports: [LegacyLogger, Logger, ErrorLogger],
})
export class LoggerModule {}
