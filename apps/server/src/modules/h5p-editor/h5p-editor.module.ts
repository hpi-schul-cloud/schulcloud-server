import { AuthGuardModule, AuthGuardOptions } from '@infra/auth-guard';
import { AuthorizationClientModule } from '@infra/authorization-client';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { S3ClientModule } from '@infra/s3-client';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { createConfigModuleOptions, DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { CoreModule } from '@src/core';
import { Logger } from '@src/core/logger';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { H5PEditorController } from './controller/h5p-editor.controller';
import { H5PContent, InstalledLibrary } from './entity';
import { authorizationClientConfig, config, s3ConfigContent, s3ConfigLibraries } from './h5p-editor.config';
import { H5PAjaxEndpointProvider, H5PEditorProvider, H5PPlayerProvider } from './provider';
import { H5PContentRepo, LibraryRepo } from './repo';
import { ContentStorage, LibraryStorage, TemporaryFileStorage } from './service';
import { H5PEditorUc } from './uc/h5p.uc';

const imports = [
	AuthorizationClientModule.register(authorizationClientConfig),
	CoreModule,
	UserModule,
	RabbitMQWrapperModule,
	MikroOrmModule.forRoot({
		...defaultMikroOrmOptions,
		type: 'mongo',
		// TODO add mongoose options as mongo options (see database.js)
		clientUrl: DB_URL,
		password: DB_PASSWORD,
		user: DB_USERNAME,
		// Needs ALL_ENTITIES for authorization
		allowGlobalContext: true,
		entities: [...ALL_ENTITIES, H5PContent, InstalledLibrary],
	}),
	ConfigModule.forRoot(createConfigModuleOptions(config)),
	S3ClientModule.register([s3ConfigContent, s3ConfigLibraries]),
	AuthGuardModule.register([AuthGuardOptions.JWT]),
];

const controllers = [H5PEditorController];

const providers = [
	Logger,
	H5PEditorUc,
	H5PContentRepo,
	LibraryRepo,
	H5PEditorProvider,
	H5PPlayerProvider,
	H5PAjaxEndpointProvider,
	ContentStorage,
	LibraryStorage,
	TemporaryFileStorage,
];

@Module({
	imports,
	controllers,
	providers,
	exports: [ContentStorage, LibraryStorage],
})
export class H5PEditorModule {}
