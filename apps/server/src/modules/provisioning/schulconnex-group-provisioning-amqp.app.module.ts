import { CoreModule } from '@core/core.module';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { HealthApiModule, HealthEntities } from '@modules/health';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { SchulconnexGroupProvisioningConsumerModule } from './schulconnex-group-provisioning-consumer.module';
import { ENTITIES } from './schulconnex-group-provisioning.entity.imports';
import { schulconnexProvisioningConfig } from './schulconnex-provisioning.config';

@Module({
	imports: [
		ConfigModule.forRoot(createConfigModuleOptions(schulconnexProvisioningConfig)),
		CoreModule,
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: [...ENTITIES, ...HealthEntities],
		}),
		HealthApiModule,
		SchulconnexGroupProvisioningConsumerModule,
	],
})
export class SchulconnexGroupProvisioningAMQPModule {}
