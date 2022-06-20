import { Module } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { FileStorageClientAdapterService } from './uc';

@Module({
	imports: [],
	controllers: [],
	providers: [FileStorageClientAdapterService, Logger],
	exports: [FileStorageClientAdapterService],
})
export class FileStorageClientModule {}
