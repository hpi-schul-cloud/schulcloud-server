import { Module } from '@nestjs/common';

import { MongoMemoryDatabaseModule } from '@infra/database';
import { HealthApiModule, HealthEntities } from '@src/modules/health';

/**
 * Internal server module used for testing.
 * Use the same modules as the InternalServerModule, but with
 * the in-memory MongoDB implementation for testing purposes.
 */
@Module({
	imports: [MongoMemoryDatabaseModule.forRoot({ entities: [...HealthEntities] }), HealthApiModule],
})
export class InternalServerTestModule {}
