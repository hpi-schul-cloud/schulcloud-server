import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { ENTITIES, TEST_ENTITIES } from './management.entity.imports';
import { ManagementModule } from './management.module';
import { MongoDriver } from '@mikro-orm/mongodb';

@Module({
	imports: [
		ManagementModule,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			// TODO repeats server module definitions
			driver: MongoDriver,
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: ENTITIES,
		}),
	],
})
export class ManagementServerModule {}

@Module({
	imports: [
		ManagementModule,
		MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions, entities: TEST_ENTITIES }),
	],
})
export class ManagementServerTestModule {}
