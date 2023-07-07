import os from 'node:os';
import path from 'node:path';

import { DynamicModule, Module } from '@nestjs/common';
import { ALL_ENTITIES } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { MongoDatabaseModuleOptions } from '@shared/infra/database/mongo-memory-database/types';
import { RabbitMQWrapperTestModule } from '@shared/infra/rabbitmq';
import { CoreModule } from '@src/core';
import { LegacyLogger, LoggerModule } from '@src/core/logger';
import { AuthenticationApiModule } from '@src/modules/authentication/authentication-api.module';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { AuthorizationModule } from '@src/modules/authorization';

import { ContentStorage } from './contentStorage/contentStorage';
import { H5PEditorController } from './controller';
import { H5PEditorModule, createS3ClientAdapter } from './h5p-editor.module';
import { LibraryStorage } from './libraryStorage/libraryStorage';
import { H5PAjaxEndpointService, H5PEditorService, H5PPlayerService } from './service';
import { TemporaryFileStorage } from './temporary-file-storage/temporary-file-storage';
import { H5PEditorUc } from './uc/h5p.uc';
import { s3ConfigTempFiles } from './s3-config';

const imports = [
	H5PEditorModule,
	MongoMemoryDatabaseModule.forRoot({ entities: [...ALL_ENTITIES] }),
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
	{ provide: ContentStorage, useValue: new ContentStorage(path.join(os.tmpdir(), '/h5p_content')) },
	{ provide: LibraryStorage, useValue: new LibraryStorage(path.join(os.tmpdir(), '/h5p_libraries')) },
	TemporaryFileStorage,
	{
		provide: 'S3ClientAdapter_TempFiles',
		useFactory: createS3ClientAdapter,
		inject: ['S3Config_TempFiles', LegacyLogger],
	},
	{
		provide: 'S3Config_TempFiles',
		useValue: s3ConfigTempFiles,
	},
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
