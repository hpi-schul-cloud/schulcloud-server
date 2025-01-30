import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { MongoDatabaseModuleOptions } from '@infra/database/mongo-memory-database/types'; // Fix me!!
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DynamicModule, Module } from '@nestjs/common';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { ENTITIES } from './management.entity.imports';
import { ManagementModule } from './management.module';

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
