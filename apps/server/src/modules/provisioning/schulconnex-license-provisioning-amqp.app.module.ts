import { CoreModule } from '@core/core.module';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { HealthApiModule, HealthEntities } from '@modules/health';
import { Module } from '@nestjs/common';
import { SchulconnexLicenseProvisioningConsumerModule } from './schulconnex-license-provisioning-consumer.module';
import { ENTITIES } from './schulconnex-license-provisioning.entity.imports';

@Module({
	imports: [
		CoreModule,
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: [...ENTITIES, ...HealthEntities],
		}),
		HealthApiModule,
		SchulconnexLicenseProvisioningConsumerModule,
	],
})
export class SchulconnexLicenseProvisioningAMQPModule {}
