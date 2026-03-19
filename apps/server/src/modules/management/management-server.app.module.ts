import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { ENTITIES, TEST_ENTITIES } from './management.entity.imports';
import { ManagementModule } from './management.module';
import migrationOptions from './migrations-options';

@Module({
	imports: [
		ManagementModule,
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: ENTITIES,
			migrationOptions: migrationOptions,
		}),
	],
})
export class ManagementServerModule {}

@Module({
	imports: [ManagementModule, MongoMemoryDatabaseModule.forRoot({ entities: TEST_ENTITIES })],
})
export class ManagementServerTestModule {}
