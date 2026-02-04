import { Module } from '@nestjs/common';

import { HealthApiModule, HealthEntities } from '@modules/health';
import { MongoMemoryDatabaseModule } from '@testing/database';

/**
 * Internal server module used for testing.
 * Use the same modules as the InternalServerModule, but with
 * the in-memory MongoDB implementation for testing purposes.
 */
@Module({
	imports: [MongoMemoryDatabaseModule.forRoot({ entities: [...HealthEntities] }), HealthApiModule],
})
export class InternalServerTestModule {}
