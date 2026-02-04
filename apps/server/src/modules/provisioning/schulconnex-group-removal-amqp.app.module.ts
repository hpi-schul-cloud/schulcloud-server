import { CoreModule } from '@core/core.module';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { HealthApiModule, HealthEntities } from '@modules/health';
import { Module } from '@nestjs/common';
import { SchulconnexGroupRemovalConsumerModule } from './schulconnex-group-removal-consumer.module';
import { ENTITIES } from './schulconnex-group-removal.entity.imports';

@Module({
	imports: [
		CoreModule,
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: [...ENTITIES, ...HealthEntities],
		}),
		HealthApiModule,
		SchulconnexGroupRemovalConsumerModule,
	],
})
export class SchulconnexGroupRemovalAMQPModule {}
