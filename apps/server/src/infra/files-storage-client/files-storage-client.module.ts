import { Module } from '@nestjs/common';
import { FilesStorageClientFactory } from './files-storage-client.factory';

// TODO: Rename the module, because there is another module with the same name
@Module({
	providers: [FilesStorageClientFactory],
	exports: [FilesStorageClientFactory],
})
export class FilesStorageClientModule {}
