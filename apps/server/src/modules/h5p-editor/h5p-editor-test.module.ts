import { S3Client } from '@aws-sdk/client-s3';
import { DynamicModule, Module, Scope } from '@nestjs/common';
import { ALL_ENTITIES } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { MongoDatabaseModuleOptions } from '@shared/infra/database/mongo-memory-database/types';
import { RabbitMQWrapperTestModule } from '@shared/infra/rabbitmq';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { AuthenticationApiModule } from '@src/modules/authentication/authentication-api.module';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { AuthorizationModule } from '@src/modules/authorization';

import { S3ClientAdapter } from '../files-storage/client/s3-client.adapter';
import { ContentStorage } from './contentStorage/contentStorage';
import { H5PContentRepo } from './contentStorage/h5p-content.repo';
import { H5PEditorController } from './controller';
import { s3Config } from './h5p-editor.config';
import { H5PEditorModule } from './h5p-editor.module';
import { S3Config } from './interface/config';
import { LibraryStorage } from './libraryStorage/libraryStorage';
import { H5PAjaxEndpointService, H5PEditorService, H5PPlayerService } from './service';
import { TemporaryFileStorage } from './temporary-file-storage/temporary-file-storage';
import { H5PEditorUc } from './uc/h5p.uc';

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
	H5PContentRepo,
	ContentStorage,
	S3ClientAdapter,
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
