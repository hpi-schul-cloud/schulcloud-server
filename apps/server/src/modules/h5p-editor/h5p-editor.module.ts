import { S3Client } from '@aws-sdk/client-s3';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ALL_ENTITIES } from '@shared/domain';
import { RabbitMQWrapperModule } from '@shared/infra/rabbitmq';

import { createConfigModuleOptions, DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { CoreModule } from '@src/core';
import { LegacyLogger, Logger } from '@src/core/logger';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { AuthorizationModule } from '@src/modules/authorization';
import { S3ClientAdapter } from '@src/modules/files-storage/client/s3-client.adapter';

import { H5PContent, InstalledLibrary } from './entity';
import { H5PContentRepo, LibraryRepo, TemporaryFileRepo } from './repo';
import { H5PEditorController } from './controller/h5p-editor.controller';
import { config, s3ConfigContent, s3ConfigLibraries } from './h5p-editor.config';
import { S3Config } from './interface/config';
import { UserModule } from '..';
import {
	H5PAjaxEndpointService,
	ContentStorage,
	LibraryStorage,
	H5PEditorService,
	H5PPlayerService,
	TemporaryFileStorage,
} from './service';
import { H5PEditorUc } from './uc/h5p.uc';

const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		new NotFoundException(`The requested ${entityName}: ${where} has not been found.`),
};

export function createS3ClientAdapter(s3config: S3Config, legacyLogger: LegacyLogger) {
	const s3Client = new S3Client({
		region: s3config.region,
		credentials: {
			accessKeyId: s3config.accessKeyId,
			secretAccessKey: s3config.secretAccessKey,
		},
		endpoint: s3config.endpoint,
		forcePathStyle: true,
		tls: true,
	});
	return new S3ClientAdapter(s3Client, s3config, legacyLogger);
}

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
		entities: [...ALL_ENTITIES, H5PContent, InstalledLibrary],

		// debug: true, // use it for locally debugging of querys
	}),
	ConfigModule.forRoot(createConfigModuleOptions(config)),
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
	{
		provide: 'S3Config_Content',
		useValue: s3ConfigContent,
	},
	{
		provide: 'S3Config_Libraries',
		useValue: s3ConfigLibraries,
	},
	{
		provide: 'S3ClientAdapter_Content',
		useFactory: createS3ClientAdapter,
		inject: ['S3Config_Content', LegacyLogger],
	},
	{
		provide: 'S3ClientAdapter_Libraries',
		useFactory: createS3ClientAdapter,
		inject: ['S3Config_Libraries', LegacyLogger],
	},
];

@Module({
	imports,
	controllers,
	providers,
})
export class H5PEditorModule {}
