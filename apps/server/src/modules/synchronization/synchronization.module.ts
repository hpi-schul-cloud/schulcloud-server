import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { SynchronizationConsole } from './console';

@Module({
	imports: [LoggerModule],
	providers: [SynchronizationConsole],
})
export class SynchronizationModule {}
