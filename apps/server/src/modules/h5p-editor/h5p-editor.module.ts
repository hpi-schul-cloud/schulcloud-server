import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Account, Role, School, SchoolYear, System, User } from '@shared/domain';
import { S3Client } from '@aws-sdk/client-s3';
import { RabbitMQWrapperModule } from '@shared/infra/rabbitmq';

import { DB_PASSWORD, DB_URL, DB_USERNAME, createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { LegacyLogger, Logger } from '@src/core/logger';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { AuthorizationModule } from '@src/modules/authorization';
import { UserRepo } from '@shared/repo';
import { S3ClientAdapter } from '@src/modules/files-storage/client/s3-client.adapter';

import { ContentStorage } from './contentStorage/contentStorage';
import { H5PContent } from './contentStorage/h5p-content.entity';
import { H5PContentRepo } from './contentStorage/h5p-content.repo';
import { H5PEditorController } from './controller/h5p-editor.controller';
import { config, s3ConfigContent, s3ConfigLibraries } from './h5p-editor.config';
import { S3Config } from './interface/config';
import { InstalledLibrary } from './libraryStorage/library.entity';
import { LibraryRepo } from './libraryStorage/library.repo';
import { LibraryStorage } from './libraryStorage/libraryStorage';
import { H5PAjaxEndpointService } from './service';
import { H5PEditorService } from './service/h5p-editor.service';
import { H5PPlayerService } from './service/h5p-player.service';
import { TemporaryFileStorage } from './temporary-file-storage/temporary-file-storage';
import { TemporaryFileRepo } from './temporary-file-storage/temporary-file.repo';
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
	RabbitMQWrapperModule,
	MikroOrmModule.forRoot({
		...defaultMikroOrmOptions,
		type: 'mongo',
		// TODO add mongoose options as mongo options (see database.js)
		clientUrl: DB_URL,
		password: DB_PASSWORD,
		user: DB_USERNAME,
		entities: [User, Account, H5PContent, Role, School, System, SchoolYear, InstalledLibrary],

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
	UserRepo,
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
