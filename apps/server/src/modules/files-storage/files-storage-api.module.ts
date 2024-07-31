import { AuthorizationClientModule } from '@infra/authorization-client';
import { AuthenticationModule } from '@modules/authentication';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { authorizationClientConfig } from './authorization-client-config';
import { FileSecurityController, FilesStorageConfigController, FilesStorageController } from './controller';
import { config } from './files-storage.config';
import { FilesStorageModule } from './files-storage.module';
import { FilesStorageUC } from './uc';

@Module({
	imports: [
		FilesStorageModule,
		AuthenticationModule,
		AuthorizationClientModule.register(authorizationClientConfig),
		CoreModule,
		HttpModule,
		ConfigModule.forRoot(createConfigModuleOptions(config)),
	],
	controllers: [FilesStorageController, FilesStorageConfigController, FileSecurityController],
	providers: [FilesStorageUC],
})
export class FilesStorageApiModule {}
