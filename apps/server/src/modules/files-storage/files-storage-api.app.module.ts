import { CoreModule } from '@core/core.module';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { AuthGuardModule, AuthGuardOptions } from '@infra/auth-guard';
import { AuthorizationClientModule } from '@infra/authorization-client';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { FileSecurityController, FilesStorageConfigController, FilesStorageController } from './controller';
import { authorizationClientConfig, config } from './files-storage.config';
import { ENTITIES } from './files-storage.entity.imports';
import { FilesStorageModule } from './files-storage.module';
import { FilesStorageUC } from './uc';

@Module({
	imports: [
		FilesStorageModule,
		AuthorizationClientModule.register(authorizationClientConfig),
		CoreModule,
		HttpModule,
		ConfigModule.forRoot(createConfigModuleOptions(config)),
		AuthGuardModule.register([AuthGuardOptions.JWT]),
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			// TODO add mongoose options as mongo options (see database.js)
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: ENTITIES,

			// debug: true, // use it for locally debugging of querys
		}),
	],
	controllers: [FilesStorageController, FilesStorageConfigController, FileSecurityController],
	providers: [FilesStorageUC],
})
export class FilesStorageApiModule {}
