import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { DynamicModule, Module, OnApplicationShutdown } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';

@Module({})
export class MongoMemoryDatabaseModule implements OnApplicationShutdown {
	static mongod: MongoMemoryServer;

	static forRoot(options?: Omit<MikroOrmModuleSyncOptions, 'type' | 'clientUrl' | 'dbName'>): DynamicModule {
		return {
			module: MongoMemoryDatabaseModule,
			imports: [
				MikroOrmModule.forRootAsync({
					useFactory: async () => {
						MongoMemoryDatabaseModule.mongod = new MongoMemoryServer();
						const clientUrl = await MongoMemoryDatabaseModule.mongod.getUri();
						return {
							...options,
							type: 'mongo',
							clientUrl,
						};
					},
				}),
			],
		};
	}

	async onApplicationShutdown(): Promise<void> {
		await MongoMemoryDatabaseModule.mongod.stop();
	}
}
