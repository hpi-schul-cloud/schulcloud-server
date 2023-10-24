import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ALL_ENTITIES } from '@shared/domain';
import { RabbitMQWrapperModule } from '@shared/infra/rabbitmq';
import { DB_PASSWORD, DB_URL, DB_USERNAME, createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { Logger } from '@src/core/logger';
import { AuthorizationReferenceModule } from '@modules/authorization/authorization-reference.module';
import { UserModule } from '@modules/user';
import { S3ClientModule } from '@shared/infra/s3-client';
import { AuthenticationModule } from '../authentication/authentication.module';
import { H5PEditorController } from './controller/h5p-editor.controller';
import { H5PContent, InstalledLibrary, TemporaryFile } from './entity';
import { config, s3ConfigContent, s3ConfigLibraries } from './h5p-editor.config';
import { H5PContentRepo, LibraryRepo, TemporaryFileRepo } from './repo';
import { ContentStorage, H5PAjaxEndpointService, LibraryStorage, TemporaryFileStorage } from './service';
import { H5PEditorProvider, H5PPlayerProvider } from './provider';
import { H5PEditorUc } from './uc/h5p.uc';

const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		new NotFoundException(`The requested ${entityName}: ${where} has not been found.`),
};

const imports = [
	AuthenticationModule,
	AuthorizationReferenceModule,
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
	H5PEditorProvider,
	H5PPlayerProvider,
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
