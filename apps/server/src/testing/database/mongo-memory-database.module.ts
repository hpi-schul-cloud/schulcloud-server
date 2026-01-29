import { MikroORM } from '@mikro-orm/core';
import { defineConfig } from '@mikro-orm/mongodb';
import { MikroOrmModule, MikroOrmModuleAsyncOptions } from '@mikro-orm/nestjs';
import { DynamicModule, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import _ from 'lodash';
import { MongoDatabaseModuleOptions } from './types';

const dbName = (): string => _.times(20, () => _.random(35).toString(36)).join('');

const createMikroOrmModule = (options: MikroOrmModuleAsyncOptions): DynamicModule => {
	const mikroOrmModule = MikroOrmModule.forRootAsync({
		useFactory: () => {
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions, no-process-env
			const clientUrl = `${process.env.MONGO_TEST_URI}/${dbName()}`;
			return defineConfig({
				allowGlobalContext: true, // can be overridden by options
				...options,
				type: 'mongo',
				clientUrl,
			});
		},
	});

	return mikroOrmModule;
};

@Module({})
export class MongoMemoryDatabaseModule implements OnModuleDestroy {
	constructor(@Inject(MikroORM) private orm: MikroORM) {}

	public static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: MongoMemoryDatabaseModule,
			imports: [createMikroOrmModule({ ...options, ...defaultMikroOrmOptions })],
			exports: [MikroOrmModule],
		};
	}

	public async onModuleDestroy(): Promise<void> {
		await this.orm.close();
	}
}
