import { CoreModule } from '@core/core.module';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { HealthApiModule, HealthEntities } from '@modules/health';
import { Module } from '@nestjs/common';
import { BoardImportApiModule } from './board-import-api.module';

@Module({
	imports: [
		CoreModule,
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: HealthEntities,
		}),
		HealthApiModule,
		BoardImportApiModule,
	],
})
export class BoardImportApiAppModule {}
