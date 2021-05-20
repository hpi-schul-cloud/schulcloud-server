import { Module } from '@nestjs/common';
import { ServerLogger } from './logger.service';

@Module({
	providers: [ServerLogger],
	exports: [ServerLogger],
})
export class LoggerModule {}
