import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { utilities, WinstonModule } from 'nest-winston';
import winston from 'winston';
import { ILoggerConfig } from './interfaces';
import { Logger } from './logger.service';

const availableLevels = {
	emerg: 0,
	alert: 1,
	crit: 2,
	error: 3,
	http: 4,
	warning: 5,
	notice: 6,
	info: 7,
	debug: 8,
};

@Module({
	imports: [
		WinstonModule.forRootAsync({
			useFactory: (configService: ConfigService<ILoggerConfig, true>) => {
				return {
					levels: availableLevels,
					transports: [
						new winston.transports.Console({
							level: configService.get<string>('NEST_LOG_LEVEL'),
							format: winston.format.combine(
								winston.format.timestamp(),
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
