import os from 'node:os';
import path from 'node:path';

import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Account, Role, School, SchoolYear, System, User } from '@shared/domain';
import { DB_PASSWORD, DB_URL, DB_USERNAME, createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { Logger } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { AuthenticationModule } from '../authentication/authentication.module';
import { H5PEditorController } from './controller/h5p-editor.controller';
import { config } from './h5p-editor.config';
import { H5PAjaxEndpointService } from './service';
import { H5PEditorService } from './service/h5p-editor.service';
import { H5PPlayerService } from './service/h5p-player.service';
import { H5PEditorUc } from './uc/h5p.uc';

import { ContentStorage } from './contentStorage/contentStorage';
import { LibraryStorage } from './libraryStorage/libraryStorage';
import { TemporaryFileStorage } from './temporary-file-storage/temporary-file-storage';
import { RabbitMQWrapperTestModule } from '@shared/infra/rabbitmq';

const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		new NotFoundException(`The requested ${entityName}: ${where} has not been found.`),
};

const storages = [
	{ provide: ContentStorage, useValue: new ContentStorage(path.join(os.tmpdir(), '/h5p_content')) },
	{ provide: LibraryStorage, useValue: new LibraryStorage(path.join(os.tmpdir(), '/h5p_libraries')) },
	{ provide: TemporaryFileStorage, useValue: new TemporaryFileStorage(path.join(os.tmpdir(), '/h5p_temporary')) },
];

const imports = [
	AuthenticationModule,
	AuthorizationModule,
	CoreModule,
	MikroOrmModule.forRoot({
		...defaultMikroOrmOptions,
		type: 'mongo',
		// TODO add mongoose options as mongo options (see database.js)
		clientUrl: DB_URL,
		password: DB_PASSWORD,
		user: DB_USERNAME,
		entities: [User, Account, Role, School, System, SchoolYear],

		// debug: true, // use it for locally debugging of querys
	}),
	ConfigModule.forRoot(createConfigModuleOptions(config)),
	RabbitMQWrapperTestModule,
];

const controllers = [H5PEditorController];

const providers = [Logger, H5PEditorUc, H5PEditorService, H5PPlayerService, H5PAjaxEndpointService, ...storages];

@Module({
	imports,
	controllers,
	providers,
})
export class H5PEditorModule {}
