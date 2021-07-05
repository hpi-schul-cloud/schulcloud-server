/* istanbul ignore file */
// TODO add spec when this will be really used
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { DynamicModule, Module } from '@nestjs/common';
import { MongoSharedDriver } from './mongo-shared-driver';
import { DB_URL, DB_USERNAME, DB_PASSWORD } from '../../../config';

// todo duplicates  mongo memory database ForbiddenOptions
// the options we want to be fixed
type NoOptions = 'type' | 'driver' | 'clientUrl' | 'dbName' | 'user' | 'password';

@Module({})
export class MongoDatabaseModule {
	static forRoot(options?: Omit<MikroOrmModuleSyncOptions, NoOptions>): DynamicModule {
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
