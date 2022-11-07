import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CoreModule } from '@src/core';
import { AuthModule } from '@src/modules/authentication';
import { AuthorizationModule } from '@src/modules/authorization';
import { FileSecurityController, FilesStorageController } from './controller';
import { FilesStorageModule } from './files-storage.module';
import { FileRecordUC, FilesStorageUC } from './uc';

@Module({
	imports: [AuthorizationModule, FilesStorageModule, AuthModule, CoreModule, HttpModule],
	controllers: [FilesStorageController, FileSecurityController],
	providers: [FilesStorageUC, FileRecordUC],
})
export class FilesStorageApiModule {}
