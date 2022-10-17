import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { Logger } from './logger.service';

@Module({
	imports: [WinstonModule.forRoot({})],
	providers: [Logger],
	exports: [Logger],
})
export class LoggerModule {}
