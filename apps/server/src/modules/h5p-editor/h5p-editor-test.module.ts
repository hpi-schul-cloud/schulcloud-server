import os from 'node:os';
import path from 'node:path';

import { DynamicModule, Module } from '@nestjs/common';
import { Account, Role, School, SchoolYear, User } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { MongoDatabaseModuleOptions } from '@shared/infra/database/mongo-memory-database/types';
import { RabbitMQWrapperTestModule } from '@shared/infra/rabbitmq';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { AuthenticationApiModule } from '@src/modules/authentication/authentication-api.module';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { AuthorizationModule } from '@src/modules/authorization';
import { UserRepo } from '@shared/repo';

import { ContentStorage } from './contentStorage/contentStorage';
import { H5PEditorController } from './controller';
import { H5PEditorModule } from './h5p-editor.module';
import { LibraryStorage } from './libraryStorage/libraryStorage';
import { H5PAjaxEndpointService, H5PEditorService, H5PPlayerService } from './service';
import { TemporaryFileStorage } from './temporary-file-storage/temporary-file-storage';
import { H5PEditorUc } from './uc/h5p.uc';
import { S3ClientAdapter } from '../files-storage/client/s3-client.adapter';
import { H5PContentRepo } from './contentStorage/h5p-content.repo';

const storages = [
	ContentStorage,
	{ provide: LibraryStorage, useValue: new LibraryStorage(path.join(os.tmpdir(), '/h5p_libraries')) },
	{ provide: TemporaryFileStorage, useValue: new TemporaryFileStorage(path.join(os.tmpdir(), '/h5p_temporary')) },
];

const imports = [
	H5PEditorModule,
	MongoMemoryDatabaseModule.forRoot({ entities: [Account, Role, School, SchoolYear, User] }),
	AuthenticationApiModule,
	AuthorizationModule,
	AuthenticationModule,
	CoreModule,
	LoggerModule,
	RabbitMQWrapperTestModule,
];
const controllers = [H5PEditorController];
const providers = [
	H5PEditorUc,
	H5PPlayerService,
	H5PEditorService,
	H5PAjaxEndpointService,
	S3ClientAdapter,
	H5PContentRepo,
	UserRepo,
	...storages,
];

@Module({
	imports,
	controllers,
	providers,
})
export class H5PEditorTestModule {
	static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: H5PEditorTestModule,
			imports: [...imports, MongoMemoryDatabaseModule.forRoot({ ...options })],
			controllers,
			providers,
		};
	}
}
