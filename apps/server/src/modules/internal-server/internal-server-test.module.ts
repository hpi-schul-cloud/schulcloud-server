import { Module } from '@nestjs/common';

import { MongoMemoryDatabaseModule } from '@infra/database';
import { HealthApiModule, HealthEntities } from '@src/modules/health';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { serverConfig } from '@modules/server';

/**
 * Internal server module used for testing.
 * Use the same modules as the InternalServerModule, but with
 * the in-memory MongoDB implementation for testing purposes.
 */
@Module({
	imports: [
		MongoMemoryDatabaseModule.forRoot({ entities: [...HealthEntities] }),
		HealthApiModule,
		ConfigModule.forRoot(createConfigModuleOptions(serverConfig)),
	],
})
export class InternalServerTestModule {}
