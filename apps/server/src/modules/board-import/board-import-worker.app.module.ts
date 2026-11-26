import { CoreModule } from '@core/core.module';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { BoardImportTaskcardsModule } from '@modules/board-import-taskcards/board-import-taskcards.module';
import { HealthApiModule, HealthEntities } from '@modules/health';
import { Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { WORKER_ENTITIES } from './board-import-worker.entity.imports';
import { BoardImportWorkerModule } from './board-import-worker.module';

const imports = [
	CoreModule,
	HealthApiModule.registerWithSessionStorage(),
	BoardImportWorkerModule,
	BoardImportTaskcardsModule,
];
const entities = [...WORKER_ENTITIES, ...HealthEntities];

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
