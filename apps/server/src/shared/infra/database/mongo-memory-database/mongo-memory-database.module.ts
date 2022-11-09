import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleAsyncOptions } from '@mikro-orm/nestjs';
import { DynamicModule, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ALL_ENTITIES } from '@shared/domain';
import { MongoDatabaseModuleOptions } from './types';

const createMikroOrmModule = async (options: MikroOrmModuleAsyncOptions): Promise<DynamicModule> => {
	const mikroOrmModule = MikroOrmModule.forRootAsync({
		// providers: [
		// 	{
		// 		provide: MongoMemoryServer,
		// 		useFactory: async () => {
		// 			const mongo = await MongoMemoryServer.create();
		// 			return mongo;
		// 		},
		// 	},
		// ],
		useFactory: () => {
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			const clientUrl = `${process.env.MONGO_TEST_URI}/${String(10000 + Math.floor(Math.random() * 1000))}`;
			return {
				allowGlobalContext: true, // can be overridden by options
				...options,
				type: 'mongo',
				clientUrl,
			};
		},
		//inject: [MongoMemoryServer],
	});

	return mikroOrmModule;
};

@Module({})
export class MongoMemoryDatabaseModule implements OnModuleDestroy {
	constructor(@Inject(MikroORM) private orm: MikroORM) {}

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
	}
}
