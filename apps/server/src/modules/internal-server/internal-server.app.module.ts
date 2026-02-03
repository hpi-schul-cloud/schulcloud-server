import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { HealthApiModule, HealthEntities } from '@modules/health';
import { serverConfig } from '@modules/server';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { MongoDriver } from '@mikro-orm/mongodb';

@Module({
	imports: [
		MikroOrmModule.forRoot({
			driver: MongoDriver,
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: [...HealthEntities],
			ensureIndexes: true,
			// debug: true, // use it only for the local queries debugging
		}),
		HealthApiModule,
		ConfigModule.forRoot(createConfigModuleOptions(serverConfig)),
	],
})
export class InternalServerModule {}
