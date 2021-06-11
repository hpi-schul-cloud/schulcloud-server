import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { DynamicModule, Module, OnApplicationShutdown } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

@Module({})
export class MongoMemoryDatabaseModule implements OnApplicationShutdown {
	static forRoot(options?: Omit<MikroOrmModuleSyncOptions, 'type' | 'clientUrl' | 'dbName'>): DynamicModule {
		return {
			module: MongoMemoryDatabaseModule,
			imports: [
				MikroOrmModule.forRootAsync({
					useFactory: async () => {
						mongod = new MongoMemoryServer();
						const clientUrl = await mongod.getUri();
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

	static async stopServer(): Promise<void> {
		if (mongod) {
			await mongod.stop();
		}
	}

	// NOTE doesn't get called unless enabled by calling module.enableShutdownHooks()
	// however we should better not do that in jest because of resource implications
	// see: https://docs.nestjs.com/fundamentals/lifecycle-events
	async onApplicationShutdown(): Promise<void> {
		await mongod.stop();
	}
}
