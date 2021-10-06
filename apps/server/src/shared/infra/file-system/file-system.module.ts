import { Module } from '@nestjs/common';
import { FileSystemAdapter } from './file-system.adapter';

@Module({
	providers: [FileSystemAdapter],
	exports: [FileSystemAdapter],
})
export class FileSystemModule {}
