import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { HealthApiModule, HealthEntities } from '@modules/health';
import { Module } from '@nestjs/common';

@Module({
	imports: [
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: HealthEntities,
		}),
		HealthApiModule,
	],
})
export class InternalServerModule {}
