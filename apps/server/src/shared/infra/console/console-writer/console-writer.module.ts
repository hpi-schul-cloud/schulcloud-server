import { Module } from '@nestjs/common';
import { ConsoleWriterService } from './console-writer.service';

@Module({
	providers: [ConsoleWriterService],
	exports: [ConsoleWriterService],
})
export class ConsoleWriterModule {}
