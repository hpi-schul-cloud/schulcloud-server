import { CoreModule } from '@core/core.module';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { HealthApiModule, HealthEntities } from '@modules/health';
import { Module } from '@nestjs/common';
import { BoardImportModule } from './board-import.module';

@Module({
	imports: [
		CoreModule,
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: HealthEntities,
		}),
		HealthApiModule,
		BoardImportModule,
	],
})
export class BoardImportWorkerAppModule {}
