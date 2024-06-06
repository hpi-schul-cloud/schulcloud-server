import { AuthenticationModule } from '@modules/authentication';
import { AuthorizationReferenceModule } from '@modules/authorization/authorization-reference.module';
import { InstanceConfigModule } from '@modules/instance-config';
import { SchoolModule } from '@modules/school';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { FileSecurityController, FilesStorageConfigController, FilesStorageController } from './controller';
import { config } from './files-storage.config';
import { FilesStorageModule } from './files-storage.module';
import { FilesStorageUC } from './uc';

@Module({
	imports: [
		AuthorizationReferenceModule,
		FilesStorageModule,
		AuthenticationModule,
		CoreModule,
		HttpModule,
		ConfigModule.forRoot(createConfigModuleOptions(config)),
		InstanceConfigModule,
		SchoolModule,
	],
	controllers: [FilesStorageController, FilesStorageConfigController, FileSecurityController],
	providers: [FilesStorageUC],
})
export class FilesStorageApiModule {}
