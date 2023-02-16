import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { utilities, WinstonModule } from 'nest-winston';
import winston from 'winston';
import { ILoggerConfig } from './interfaces';
import { Logger } from './logger.service';

@Module({
	imports: [
		WinstonModule.forRootAsync({
			useFactory: (configService: ConfigService<ILoggerConfig, true>) => {
				return {
					levels: winston.config.syslog.levels,
					level: configService.get<string>('NEST_LOG_LEVEL'),
					exitOnError: false,
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
	providers: [Logger],
	exports: [Logger],
})
export class LoggerModule {}
