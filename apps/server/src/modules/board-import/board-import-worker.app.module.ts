import { CoreModule } from '@core/core.module';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { HealthApiModule, HealthEntities } from '@modules/health';
import { Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { BoardImportWorkerModule } from './board-import-worker.module';
import { ENTITIES } from './board-import.entity.imports';

const imports = [CoreModule, HealthApiModule, BoardImportWorkerModule];
const entities = [...ENTITIES, ...HealthEntities];

@Module({
	imports: [
		...imports,
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities,
		}),
	],
})
export class BoardImportWorkerAppModule {}

@Module({
	imports: [...imports, MongoMemoryDatabaseModule.forRoot({ entities })],
})
export class BoardImportWorkerTestModule {}
