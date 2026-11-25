import { CoreModule } from '@core/core.module';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { AccountEntity } from '@modules/account/repo';
import { HealthApiModule, HealthEntities } from '@modules/health';
import { Role } from '@modules/role/repo';
import { User } from '@modules/user/repo';
import { Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { BoardImportWorkerModule } from './board-import-worker.module';
import { ENTITIES } from './board-import.entity.imports';

const imports = [CoreModule, HealthApiModule, BoardImportWorkerModule];
const entities = [...ENTITIES, ...HealthEntities, User, Role, AccountEntity];

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
