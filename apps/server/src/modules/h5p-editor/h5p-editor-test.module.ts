import { CoreModule } from '@core/core.module';
import { LoggerModule } from '@core/logger';
import { AuthorizationClientModule } from '@infra/authorization-client';
import { RabbitMQWrapperTestModule } from '@infra/rabbitmq';
import { S3ClientModule } from '@infra/s3-client';
import { AuthenticationApiTestModule } from '@modules/authentication/authentication-api-test.module';
import { UserModule } from '@modules/user';
import { DynamicModule, Module } from '@nestjs/common';
import { MongoDatabaseModuleOptions, MongoMemoryDatabaseModule } from '@testing/database';
import { H5PEditorController } from './controller';
import { H5PEditorModule } from './h5p-editor.app.module';
import { authorizationClientConfig, s3ConfigContent, s3ConfigLibraries } from './h5p-editor.config';
import { TEST_ENTITIES } from './h5p-editor.entity.exports';
import { H5PAjaxEndpointProvider, H5PEditorProvider, H5PPlayerProvider } from './provider';
import { H5PContentRepo, LibraryRepo } from './repo';
import { ContentStorage, LibraryStorage, TemporaryFileStorage } from './service';
import { H5PEditorUc } from './uc/h5p.uc';

const imports = [
	H5PEditorModule,
	MongoMemoryDatabaseModule.forRoot({ entities: TEST_ENTITIES }),
	AuthenticationApiTestModule,
	AuthorizationClientModule.register(authorizationClientConfig),
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
