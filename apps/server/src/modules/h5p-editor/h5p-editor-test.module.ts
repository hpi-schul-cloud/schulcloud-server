import { MongoDatabaseModuleOptions, MongoMemoryDatabaseModule } from '@infra/database';
import { RabbitMQWrapperTestModule } from '@infra/rabbitmq';
import { S3ClientModule } from '@infra/s3-client';
import { AuthenticationModule } from '@modules/authentication';
import { AuthenticationApiModule } from '@modules/authentication/authentication-api.module';
import { AuthorizationReferenceModule } from '@modules/authorization/authorization-reference.module';
import { UserModule } from '@modules/user';
import { DynamicModule, Module } from '@nestjs/common';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { H5PEditorController } from './controller';
import { H5PContent } from './entity';
import { s3ConfigContent, s3ConfigLibraries } from './h5p-editor.config';
import { H5PEditorModule } from './h5p-editor.module';
import { H5PAjaxEndpointProvider, H5PEditorProvider, H5PPlayerProvider } from './provider';
import { H5PContentRepo, LibraryRepo } from './repo';
import { ContentStorage, LibraryStorage, TemporaryFileStorage } from './service';
import { H5PEditorUc } from './uc/h5p.uc';

const imports = [
	H5PEditorModule,
	MongoMemoryDatabaseModule.forRoot({ entities: [...ALL_ENTITIES, H5PContent] }),
	AuthenticationApiModule,
	AuthorizationReferenceModule,
	AuthenticationModule,
	UserModule,
	CoreModule,
	LoggerModule,
	RabbitMQWrapperTestModule,
	S3ClientModule.register([s3ConfigContent, s3ConfigLibraries]),
];
const controllers = [H5PEditorController];
const providers = [
	H5PEditorUc,
	H5PPlayerProvider,
	H5PEditorProvider,
	H5PAjaxEndpointProvider,
	H5PContentRepo,
	LibraryRepo,
	ContentStorage,
	LibraryStorage,
	TemporaryFileStorage,
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
