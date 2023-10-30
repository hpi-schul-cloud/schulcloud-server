import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CoreModule } from '@src/core/core.module';
import { AuthenticationModule } from '../authentication/authentication.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { FileSecurityController } from './controller/file-security.controller';
import { FilesStorageController } from './controller/files-storage.controller';
import { FilesStorageModule } from './files-storage.module';
import { FilesStorageUC } from './uc/files-storage.uc';

@Module({
	imports: [AuthorizationModule, FilesStorageModule, AuthenticationModule, CoreModule, HttpModule],
	controllers: [FilesStorageController, FileSecurityController],
	providers: [FilesStorageUC],
})
export class FilesStorageApiModule {}
