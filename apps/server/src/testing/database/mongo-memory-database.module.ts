import { MaybePromise, MikroORM } from '@mikro-orm/core';
import { defineConfig, MongoDriver } from '@mikro-orm/mongodb';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { TEST_ENTITIES } from '@modules/server/server.entity.imports';
import { DynamicModule, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import _ from 'lodash';

import { MongoDatabaseModuleOptions } from './types';

const dbName = (): string => _.times(20, () => _.random(35).toString(36)).join('');

const getEntityName = (entity: unknown): string => {
	if (typeof entity === 'string') {
		return entity;
	}

	if (typeof entity === 'function') {
		return entity.name;
	}

	if (entity && typeof entity === 'object' && 'name' in entity) {
		return String((entity as { name: unknown }).name);
	}

	return String(entity);
};

const dedupeByEntityName = <T>(entities: T[]): T[] => {
	const uniqueByName = new Map<string, T>();

	for (const entity of entities) {
		uniqueByName.set(getEntityName(entity), entity);
	}

	return [...uniqueByName.values()];
};

const createMikroOrmModule = (options: MongoDatabaseModuleOptions | Record<string, unknown> = {}): MaybePromise<DynamicModule> => {
	const mikroOrmModule = MikroOrmModule.forRootAsync({
		driver: MongoDriver,
		useFactory: () => {
			const typedOptions = options as MongoDatabaseModuleOptions;
			const configuredEntities = typedOptions.entities;
			const configuredEntitiesArray = configuredEntities
				? Array.isArray(configuredEntities)
					? configuredEntities
					: [configuredEntities]
				: [];
			const mergedEntities = dedupeByEntityName([...configuredEntitiesArray, ...TEST_ENTITIES]);

			// eslint-disable-next-line no-process-env
			const clientUrl = `${process.env.MONGO_TEST_URI}/${dbName()}`;
			return defineConfig({
				allowGlobalContext: true, // can be overridden by options
				...typedOptions,
				driver: MongoDriver,
				clientUrl,
				entities: mergedEntities,
			} as Parameters<typeof defineConfig>[0]);
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
		// Give async CQRS handlers (triggered near app shutdown) a short chance to finish
		// before closing the in-memory Mongo client to avoid teardown race errors in tests.
		await new Promise((resolve) => setTimeout(resolve, 50));
		await this.orm.close();
	}
}
