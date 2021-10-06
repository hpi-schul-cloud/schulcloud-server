import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { DynamicModule, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ALL_ENTITIES } from '@shared/domain';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoDatabaseModuleOptions } from '../types';

const createMikroOrmModule = async (options: MikroOrmModuleSyncOptions): Promise<DynamicModule> => {
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
	if (mikroOrmModule.imports && mikroOrmModule.imports.length > 0) {
		const mikroOrmCoreModule = (await mikroOrmModule.imports[0]) as DynamicModule;
		mikroOrmCoreModule.exports ||= [];
		mikroOrmCoreModule.exports.push(MongoMemoryServer);
	}

	return mikroOrmModule;
};

@Module({})
export class MongoMemoryDatabaseModule implements OnModuleDestroy {
	constructor(
		@Inject(MikroORM) private orm: MikroORM,
		@Inject(MongoMemoryServer) private mongod: MongoMemoryServer,
		private readonly moduleRef: ModuleRef
	) {}

	static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		const defaultOptions = {
			entities: ALL_ENTITIES,
		};
		return {
			module: MongoMemoryDatabaseModule,
			imports: [createMikroOrmModule({ ...defaultOptions, ...options })],
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
