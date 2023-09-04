import { DynamicModule, Module } from '@nestjs/common';
import { ALL_ENTITIES } from '@shared/domain';
import { MongoMemoryDatabaseModule, MongoDatabaseModuleOptions } from '@shared/infra/database';
import { RabbitMQWrapperTestModule } from '@shared/infra/rabbitmq';
import { CoreModule } from '@src/core';
import { LegacyLogger, LoggerModule } from '@src/core/logger';
import { AuthenticationApiModule } from '@src/modules/authentication/authentication-api.module';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { AuthorizationModule } from '@src/modules/authorization';
import { UserModule } from '..';
import { H5PEditorController } from './controller';
import { s3ConfigContent, s3ConfigLibraries } from './h5p-editor.config';
import { H5PEditorModule, createS3ClientAdapter } from './h5p-editor.module';
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

const imports = [
	H5PEditorModule,
	MongoMemoryDatabaseModule.forRoot({ entities: [...ALL_ENTITIES] }),
	AuthenticationApiModule,
	AuthorizationModule,
	AuthenticationModule,
	UserModule,
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
	H5PContentRepo,
	LibraryRepo,
	TemporaryFileRepo,
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
