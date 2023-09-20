import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQWrapperModule } from '@shared/infra/rabbitmq';
import { createConfigModuleOptions, DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { ALL_ENTITIES } from '@shared/domain';
import { DB_PASSWORD, DB_URL, DB_USERNAME, createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { Logger } from '@src/core/logger';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { AuthorizationModule } from '@src/modules/authorization';

import { S3ClientModule } from '@shared/infra/s3-client';
import { UserModule } from '..';
import { H5PEditorController } from './controller/h5p-editor.controller';
import { H5PContent, InstalledLibrary, TemporaryFile } from './entity';
import { config, s3ConfigContent, s3ConfigLibraries } from './h5p-editor.config';
import { H5PContentRepo, LibraryRepo, TemporaryFileRepo } from './repo';
import {
	ContentStorage,
	H5PAjaxEndpointService,
	H5PEditorService,
	H5PPlayerService,
	LibraryStorage,
	TemporaryFileStorage,
} from './service';
import { H5PEditorUc } from './uc/h5p.uc';

const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		new NotFoundException(`The requested ${entityName}: ${where} has not been found.`),
};

const imports = [
	AuthenticationModule,
	AuthorizationModule,
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
		entities: [...ALL_ENTITIES, H5PContent, TemporaryFile, InstalledLibrary],
		// debug: true, // use it for locally debugging of querys
	}),
	ConfigModule.forRoot(createConfigModuleOptions(config)),
	S3ClientModule.register([s3ConfigContent, s3ConfigLibraries]),
];

const controllers = [H5PEditorController];

const providers = [
	Logger,
	H5PEditorUc,
	H5PContentRepo,
	LibraryRepo,
	TemporaryFileRepo,
	H5PEditorService,
	H5PPlayerService,
	H5PAjaxEndpointService,
	ContentStorage,
	LibraryStorage,
	TemporaryFileStorage,
];

@Module({
	imports,
	controllers,
	providers,
})
export class H5PEditorModule {}
