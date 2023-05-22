import { DynamicModule, Module } from '@nestjs/common';
import { Account, Role, School, SchoolYear, User } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { MongoDatabaseModuleOptions } from '@shared/infra/database/mongo-memory-database/types';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { AuthorizationModule } from '@src/modules/authorization';
import { AuthenticationApiModule } from '../authentication/authentication-api.module';
import { H5PEditorModule } from './h5p-editor.module';

const imports = [
	H5PEditorModule,
	MongoMemoryDatabaseModule.forRoot({ entities: [Account, Role, School, SchoolYear, User] }),
	AuthenticationApiModule,
	AuthorizationModule,
	AuthenticationModule,
	CoreModule,
	LoggerModule,
];
const controllers = [];
const providers = [];
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
