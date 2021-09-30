import { Module } from '@nestjs/common';
import { ConsoleWriter } from './console-writer.service';

@Module({
	imports: [ConsoleWriter],
	exports: [ConsoleWriter],
})
export class ConsoleWriterModule {}
