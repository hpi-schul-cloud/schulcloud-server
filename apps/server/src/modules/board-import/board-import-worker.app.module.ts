import { CoreModule } from '@core/core.module';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { HealthApiModule, HealthEntities } from '@modules/health';
import { Module } from '@nestjs/common';
import { BoardImportAmqpModule } from './board-import-amqp.module';
import { ENTITIES } from './board-import.entity.imports';
import { BoardImportModule } from './board-import.module';

@Module({
	imports: [
		CoreModule,
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: [...ENTITIES, ...HealthEntities],
		}),
		HealthApiModule,
		BoardImportModule,
		BoardImportAmqpModule,
	],
})
export class BoardImportWorkerAppModule {}
