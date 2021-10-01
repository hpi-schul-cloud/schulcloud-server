import { Module } from '@nestjs/common';
import { ConsoleWriterService } from './console-writer.service';

@Module({
	imports: [ConsoleWriterService],
	exports: [ConsoleWriterService],
})
export class ConsoleWriterModule {}
