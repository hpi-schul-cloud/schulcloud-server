import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Account, Role, School, SchoolYear, System, User } from '@shared/domain';
import { RabbitMQWrapperModule } from '@shared/infra/rabbitmq';

import { DB_PASSWORD, DB_URL, DB_USERNAME, createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { LegacyLogger, Logger } from '@src/core/logger';
import { UserModule } from '..';

import { LibraryStorage } from '../h5p-editor/service';
import { config, s3ConfigLibraries } from '../h5p-editor/h5p-editor.config';
import { LibraryRepo } from '../h5p-editor/repo';
import { createS3ClientAdapter } from '../h5p-editor';

import { H5PLibraryManagementService } from './service/h5p-library-management.service';
import { InstalledLibrary } from '../h5p-editor/entity';

const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		new NotFoundException(`The requested ${entityName}: ${where} has not been found.`),
};

const imports = [
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
		allowGlobalContext: true,
		entities: [User, Account, Role, School, System, SchoolYear, InstalledLibrary],
	}),
	ConfigModule.forRoot(createConfigModuleOptions(config)),
];

const controllers = [];

const providers = [
	Logger,
	H5PLibraryManagementService,
	LibraryRepo,
	LibraryStorage,
	{
		provide: 'S3Config_Libraries',
		useValue: s3ConfigLibraries,
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
export class H5PLibraryManagementModule {}
