import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CoreModule } from '@src/core';
import { AuthenticationModule } from '@modules/authentication/authentication.module';
import { AuthorizationReferenceModule } from '@modules/authorization/authorization-reference.module';
import { FileSecurityController, FilesStorageController } from './controller';
import { FilesStorageModule } from './files-storage.module';
import { FilesStorageUC } from './uc';

@Module({
	imports: [AuthorizationReferenceModule, FilesStorageModule, AuthenticationModule, CoreModule, HttpModule],
	controllers: [FilesStorageController, FileSecurityController],
	providers: [FilesStorageUC],
})
export class FilesStorageApiModule {}
