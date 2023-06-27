import os from 'node:os';
import path from 'node:path';

import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { Module, NotFoundException, Scope } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Account, Role, School, SchoolYear, System, User } from '@shared/domain';
import { RabbitMQWrapperModule } from '@shared/infra/rabbitmq';
import { DB_PASSWORD, DB_URL, DB_USERNAME, createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { Logger } from '@src/core/logger';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { AuthorizationModule } from '@src/modules/authorization';
import { S3Client } from '@aws-sdk/client-s3';
import { H5PEditorController } from './controller/h5p-editor.controller';
import { config, s3Config } from './h5p-editor.config';
import { S3Config } from './interface/config';
import { H5PAjaxEndpointService } from './service';
import { H5PEditorService } from './service/h5p-editor.service';
import { H5PPlayerService } from './service/h5p-player.service';
import { H5PEditorUc } from './uc/h5p.uc';
import { ContentStorage } from './contentStorage/contentStorage';
import { LibraryStorage } from './libraryStorage/libraryStorage';
import { TemporaryFileStorage } from './temporary-file-storage/temporary-file-storage';
import { S3ClientAdapter } from '../files-storage/client/s3-client.adapter';
import { ContentMetadataRepo } from './contentStorage/contentMetadata.repo';
import { ContentMetadata } from './contentStorage/contentMetadata.entity';

const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		new NotFoundException(`The requested ${entityName}: ${where} has not been found.`),
};

const storages = [
	ContentStorage,
	{ provide: LibraryStorage, useValue: new LibraryStorage(path.join(os.tmpdir(), '/h5p_libraries')) },
	{ provide: TemporaryFileStorage, useValue: new TemporaryFileStorage(path.join(os.tmpdir(), '/h5p_temporary')) },
];

const imports = [
	AuthenticationModule,
	AuthorizationModule,
	CoreModule,
	RabbitMQWrapperModule,
	MikroOrmModule.forRoot({
		...defaultMikroOrmOptions,
		type: 'mongo',
		// TODO add mongoose options as mongo options (see database.js)
		clientUrl: DB_URL,
		password: DB_PASSWORD,
		user: DB_USERNAME,
		entities: [User, Account, ContentMetadata, Role, School, System, SchoolYear],

		// debug: true, // use it for locally debugging of querys
	}),
	ConfigModule.forRoot(createConfigModuleOptions(config)),
];

const controllers = [H5PEditorController];

const providers = [
	{
		provide: 'S3_Client',
		scope: Scope.REQUEST,
		useFactory: (configProvider: S3Config) =>
			new S3Client({
				region: configProvider.region,
				credentials: {
					accessKeyId: configProvider.accessKeyId,
					secretAccessKey: configProvider.secretAccessKey,
				},
				endpoint: configProvider.endpoint,
				forcePathStyle: true,
				tls: true,
			}),
		inject: ['S3_Config'],
	},
	{
		provide: 'S3_Config',
		useValue: s3Config,
	},
	Logger,
	H5PEditorUc,
	H5PEditorService,
	S3ClientAdapter,
	H5PPlayerService,
	ContentMetadataRepo,
	H5PAjaxEndpointService,
	...storages,
];

@Module({
	imports,
	controllers,
	providers,
})
export class H5PEditorModule {}
