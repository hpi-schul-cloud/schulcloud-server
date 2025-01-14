import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { serverConfig } from '@modules/server';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { HealthApiModule, HealthEntities } from '@src/modules/health';

@Module({
	imports: [
		MikroOrmModule.forRoot({
			type: 'mongo',
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
