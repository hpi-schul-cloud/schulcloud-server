import { CoreModule } from '@core/core.module';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { HealthApiModule, HealthEntities } from '@modules/health';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { SchulconnexLicenseProvisioningConsumerModule } from './schulconnex-license-provisioning-consumer.module';
import { ENTITIES } from './schulconnex-license-provisioning.entity.imports';
import { schulconnexProvisioningConfig } from './schulconnex-provisioning.config';
import { MongoDriver } from '@mikro-orm/mongodb';

@Module({
	imports: [
		ConfigModule.forRoot(createConfigModuleOptions(schulconnexProvisioningConfig)),
		CoreModule,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			driver: MongoDriver,
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: [...ENTITIES, ...HealthEntities],
		}),
		RabbitMQWrapperModule,
		HealthApiModule,
		SchulconnexLicenseProvisioningConsumerModule,
	],
})
export class SchulconnexLicenseProvisioningAMQPModule {}
