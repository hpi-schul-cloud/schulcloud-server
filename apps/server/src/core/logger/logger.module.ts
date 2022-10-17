import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import winston from 'winston';
import { Logger } from './logger.service';

@Module({
	imports: [
		WinstonModule.forRoot({
			transports: [
				new winston.transports.Console({
					format: winston.format.combine(winston.format.timestamp(), winston.format.ms()),
				}),
			],
		}),
	],
	providers: [Logger],
	exports: [Logger],
})
export class LoggerModule {}
