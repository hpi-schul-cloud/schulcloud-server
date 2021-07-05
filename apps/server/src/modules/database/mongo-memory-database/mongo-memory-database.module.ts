import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { DynamicModule, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { MongoMemoryServer } from 'mongodb-memory-server';

const createMikroOrmModule = (options: MikroOrmModuleSyncOptions): DynamicModule => {
	const mikroOrmModule = MikroOrmModule.forRootAsync({
		providers: [
			{
				provide: MongoMemoryServer,
				useFactory: () => {
					return new MongoMemoryServer();
				},
			},
		],
		useFactory: async (mongod: MongoMemoryServer) => {
			const clientUrl = await mongod.getUri();
			return {
				...options,
				type: 'mongo',
				clientUrl,
			};
		},
		inject: [MongoMemoryServer],
	});

	// TODO maybe we can find a better way to export the MongoMemoryServer provider
	// currently we cannot specify the export otherwise because MikroOrmModuleSyncOptions doesn't provide an export option
	const mikroOrmCoreModule = (mikroOrmModule.imports || [])[0] as DynamicModule;
	if (mikroOrmCoreModule) {
		mikroOrmCoreModule.exports ||= [];
		mikroOrmCoreModule.exports.push(MongoMemoryServer);
	}

	return mikroOrmModule;
};

// TODO defined in multiple places?
/** options we not allow to pass as they are internally replaced by using the in memory mongo  */
type ForbiddenOptions = 'type' | 'driver' | 'clientUrl' | 'dbName' | 'user' | 'password';
@Module({})
export class MongoMemoryDatabaseModule implements OnModuleDestroy {
	constructor(
		@Inject(MikroORM) private orm: MikroORM,
		@Inject(MongoMemoryServer) private mongod: MongoMemoryServer,
		private readonly moduleRef: ModuleRef
	) {}

	static forRoot(options?: Omit<MikroOrmModuleSyncOptions, ForbiddenOptions>): DynamicModule {
		return {
			module: MongoMemoryDatabaseModule,
			imports: [createMikroOrmModule(options || {})],
			exports: [MikroOrmModule],
		};
	}

	// close db connection and stop mongo server
	// NOTE: we have to call close() on this module to make nest call this callback
	async onModuleDestroy(): Promise<void> {
		await this.orm.close();
		await this.mongod.stop();
	}
}
