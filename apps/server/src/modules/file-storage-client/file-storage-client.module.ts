import { Module } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { FileStorageClientUC } from './uc';
import { FileStorageClientRepo } from './repo';

@Module({
	imports: [],
	controllers: [],
	providers: [FileStorageClientUC, Logger, FileStorageClientRepo],
	exports: [FileStorageClientUC],
})
export class FileStorageClientModule {}
