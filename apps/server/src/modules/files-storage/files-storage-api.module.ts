import { Module } from '@nestjs/common';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { AuthModule } from '@src/modules/authentication';
import { AuthorizationModule } from '@src/modules/authorization';
import { FileSecurityController } from './controller/file-security.controller';
import { FilesStorageController } from './controller/files-storage.controller';
import { FilesStorageModule } from './files-storage.module';

@Module({
	imports: [AuthorizationModule, FilesStorageModule, AuthModule, CoreModule, LoggerModule],
	controllers: [FilesStorageController, FileSecurityController],
	// providers: [FilesStorageUC, FileRecordUC],
})
export class FilesStorageApiModule {}
