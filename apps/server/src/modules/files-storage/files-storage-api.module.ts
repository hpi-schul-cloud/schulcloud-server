import { AuthGuardModule } from '@infra/auth-guard';
import { AuthorizationClientModule } from '@infra/authorization-client';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { FileSecurityController, FilesStorageConfigController, FilesStorageController } from './controller';
import { authorizationClientConfig, config } from './files-storage.config';
import { FilesStorageModule } from './files-storage.module';
import { FilesStorageUC } from './uc';

@Module({
	imports: [
		FilesStorageModule,
		AuthorizationClientModule.register(authorizationClientConfig),
		CoreModule,
		HttpModule,
		ConfigModule.forRoot(createConfigModuleOptions(config)),
		AuthGuardModule,
	],
	controllers: [FilesStorageController, FilesStorageConfigController, FileSecurityController],
	providers: [FilesStorageUC],
})
export class FilesStorageApiModule {}
