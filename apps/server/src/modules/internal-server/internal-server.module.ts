import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { DB_URL, DB_USERNAME, DB_PASSWORD } from '@src/config';
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
	],
})
export class InternalServerModule {}
