import { CoreModule } from '@core/core.module';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { serverConfig } from '../server';
import { SchulconnexLicenseProvisioningConsumerModule } from './schulconnex-license-provisioning-consumer.module';

@Module({
	imports: [
		ConfigModule.forRoot(createConfigModuleOptions(serverConfig)),
		CoreModule,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			// TODO add mongoose options as mongo options (see database.js)
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: [...ALL_ENTITIES],

			// debug: true, // use it for locally debugging of querys
		}),
		RabbitMQWrapperModule,
		SchulconnexLicenseProvisioningConsumerModule,
	],
})
export class SchulconnexLicenseProvisioningAMQPModule {}
