import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { Logger } from '@src/core/logger';
import { FileStorageClientAdapterService } from './uc';
// import { FileApiFactory } from './fileStorageApi/v3';

// ??? const fileStorageClient = FileApiFactory(undefined, 'http://localhost:4444/api/v3/');

@Module({
	imports: [HttpModule.register({ timeout: 600000 })], // todo: add config
	controllers: [],
	providers: [FileStorageClientAdapterService, Logger],
	exports: [FileStorageClientAdapterService],
})
export class FileStorageClientModule {}
