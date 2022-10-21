import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { utilities, WinstonModule } from 'nest-winston';
import winston from 'winston';
import { ILoggerConfig } from './interfaces';
import { Logger } from './logger.service';

const availableLevels = {
	error: 0,
	http: 1,
	warn: 2,
	info: 3,
	verbose: 4,
	debug: 5,
	silly: 6,
};
@Module({
	imports: [
		WinstonModule.forRootAsync({
			useFactory: (configService: ConfigService<ILoggerConfig, true>) => {
				return {
					levels: availableLevels,
					transports: [
						new winston.transports.Console({
							level: configService.get<string>('LOG_LEVEL'),
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
