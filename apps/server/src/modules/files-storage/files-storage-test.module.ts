import { CoreModule } from '@core/core.module';
import { LoggerModule } from '@core/logger';
import { MongoDatabaseModuleOptions, MongoMemoryDatabaseModule } from '@infra/database';
import { RabbitMQWrapperTestModule } from '@infra/rabbitmq';
import { AccountEntity } from '@modules/account/domain/entity/account.entity';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { SystemEntity } from '@modules/system/entity';
import { DynamicModule, Module } from '@nestjs/common';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import {
	FederalStateEntity,
	Role,
	SchoolEntity,
	SchoolRolePermission,
	SchoolRoles,
	SchoolYearEntity,
	StorageProviderEntity,
	User,
	UserLoginMigrationEntity,
} from '@shared/domain/entity';
import { FileRecord } from './entity';
import { FilesStorageApiModule } from './files-storage-api.app.module';

const ENTITIES = [
	AccountEntity,
	FederalStateEntity,
	Role,
	SchoolEntity,
	SchoolRoles,
	SchoolRolePermission,
	SchoolSystemOptionsEntity,
	SchoolYearEntity,
	StorageProviderEntity,
	SystemEntity,
	User,
	UserLoginMigrationEntity,
];

const imports = [
	FilesStorageApiModule,
	MongoMemoryDatabaseModule.forRoot({ entities: [...ENTITIES, FileRecord] }),
	RabbitMQWrapperTestModule,
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
export class FilesStorageTestModule {
	public static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: FilesStorageTestModule,
			imports: [...imports, MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions, ...options })],
			controllers,
			providers,
		};
	}
}
