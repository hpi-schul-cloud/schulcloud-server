import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleAsyncOptions } from '@mikro-orm/nestjs';
import { DynamicModule, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ALL_ENTITIES } from '@shared/domain/entity';
import _ from 'lodash';
import { MongoDriver } from '@mikro-orm/mongodb';
import { MongoDatabaseModuleOptions } from './types';

const dbName = () => _.times(20, () => _.random(35).toString(36)).join('');

const createMikroOrmModule = (options: MikroOrmModuleAsyncOptions): DynamicModule => {
	const mikroOrmModule = MikroOrmModule.forRootAsync({
		useFactory: () => {
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions, no-process-env
			const clientUrl = `${process.env.MONGO_TEST_URI}/${dbName()}`;
			return {
				allowGlobalContext: true, // can be overridden by options
				...options,
				driver: MongoDriver,
				clientUrl,
			};
		},
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
