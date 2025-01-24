import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { MongoDatabaseModuleOptions } from '@infra/database/mongo-memory-database/types'; // Fix me!!
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { RoomEntity } from '@modules/room/repo/entity';
import { SystemEntity } from '@modules/system/entity/system.entity';
import { DynamicModule, Module } from '@nestjs/common';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { FederalStateEntity } from '@shared/domain/entity/federal-state.entity';
import { Role } from '@shared/domain/entity/role.entity';
import { SchoolEntity, SchoolRoles } from '@shared/domain/entity/school.entity';
import { SchoolYearEntity } from '@shared/domain/entity/schoolyear.entity';
import { StorageProviderEntity } from '@shared/domain/entity/storageprovider.entity';
import { ManagementModule } from './management.module';

export const ENTITIES = [
	FederalStateEntity,
	Role,
	RoomEntity,
	SchoolEntity,
	SchoolRoles,
	SchoolYearEntity,
	StorageProviderEntity,
	SystemEntity,
];

@Module({
	imports: [
		ManagementModule,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			// TODO repeats server module definitions
			type: 'mongo',
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: ENTITIES,
		}),
	],
})
export class ManagementServerModule {}

@Module({
	imports: [ManagementModule, MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions })],
})
export class ManagementServerTestModule {
	public static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: ManagementModule,
			imports: [MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions, ...options })],
		};
	}
}
