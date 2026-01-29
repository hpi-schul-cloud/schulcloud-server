import { CoreModule } from '@core/core.module';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { HealthApiModule, HealthEntities } from '@modules/health';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { SchulconnexGroupProvisioningConsumerModule } from './schulconnex-group-provisioning-consumer.module';
import { ENTITIES } from './schulconnex-group-provisioning.entity.imports';
import { schulconnexProvisioningConfig } from './schulconnex-provisioning.config';

@Module({
	imports: [
		ConfigModule.forRoot(createConfigModuleOptions(schulconnexProvisioningConfig)),
		CoreModule,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: [...ENTITIES, ...HealthEntities],
		}),
		HealthApiModule,
		SchulconnexGroupProvisioningConsumerModule,
	],
})
export class SchulconnexGroupProvisioningAMQPModule {}
