import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleAsyncOptions } from '@mikro-orm/nestjs';
import { DynamicModule, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ALL_ENTITIES } from '@shared/domain';
import { MongoMemoryServer } from 'mongodb-memory-server-global-4.2';
import { MongoDatabaseModuleOptions } from './types';

const createMikroOrmModule = async (options: MikroOrmModuleAsyncOptions): Promise<DynamicModule> => {
	const mikroOrmModule = MikroOrmModule.forRootAsync({
		providers: [
			{
				provide: MongoMemoryServer,
				useFactory: async () => {
					const mongo = await MongoMemoryServer.create();
					return mongo;
				},
			},
		],
		useFactory: async (mongo: MongoMemoryServer) => {
			await mongo.ensureInstance();
			const clientUrl = mongo.getUri();
			return {
				allowGlobalContext: true, // can be overridden by options
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

	async onModuleDestroy(): Promise<void> {
		await this.orm.close();
		await this.mongod.stop();
	}
}
