/* istanbul ignore file */
// TODO add spec when this will be really used
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DynamicModule, Module } from '@nestjs/common';
import { MongoSharedDriver } from './mongo-shared-driver';
import { DB_URL, DB_USERNAME, DB_PASSWORD } from '../../../config';
import { MongoDatabaseModuleOptions } from '../types';

@Module({})
export class MongoDatabaseModule {
	static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: MongoDatabaseModule,
			imports: [
				MikroOrmModule.forRoot({
					...(options || {}),
					driver: MongoSharedDriver,
					clientUrl: DB_URL,
					user: DB_USERNAME,
					password: DB_PASSWORD,
				}),
			],
		};
	}
}
