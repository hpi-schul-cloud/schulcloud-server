import { Module } from '@nestjs/common';

import { MongoMemoryDatabaseModule } from '@infra/database';
import { HealthApiModule, HealthEntities } from '@modules/health';
import { serverConfig } from '@modules/server';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';

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
