import { MaybePromise, MikroORM } from '@mikro-orm/core';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { defineConfig, MongoDriver } from '@mikro-orm/mongodb';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DynamicModule, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import _ from 'lodash';

import { MongoDatabaseModuleOptions } from './types';

const dbName = (): string => _.times(20, () => _.random(35).toString(36)).join('');

const createMikroOrmModule = (options: MongoDatabaseModuleOptions): MaybePromise<DynamicModule> => {
	const mikroOrmModule = MikroOrmModule.forRootAsync({
		driver: MongoDriver,
		useFactory: () => {
			// eslint-disable-next-line no-process-env
			const clientUrl = `${process.env.MONGO_TEST_URI}/${dbName()}`;
			return defineConfig({
				allowGlobalContext: true, // can be overridden by options
				...options,
				driver: MongoDriver,
				clientUrl,
				metadataProvider: ReflectMetadataProvider,
			});
		},
	});

	return mikroOrmModule;
};

@Module({})
export class MongoMemoryDatabaseModule implements OnModuleDestroy {
	constructor(@Inject(MikroORM) private orm: MikroORM) {}

	public static forRoot(options?: MongoDatabaseModuleOptions): MaybePromise<DynamicModule> {
		return {
			module: MongoMemoryDatabaseModule,
			imports: [createMikroOrmModule({ ...options })],
		};
	}

	public async onModuleDestroy(): Promise<void> {
		await this.orm.close();
	}
}
