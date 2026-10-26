import { type AnyEntity, type EntityClass, MikroORM } from '@mikro-orm/core';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MongoDriver } from '@mikro-orm/mongodb';

/**
 * Test-Setup to make all entities available without a database connection.
 * @returns
 */
export const setupEntities = async (entities: EntityClass<AnyEntity>[]): Promise<MikroORM> => {
	const orm = await MikroORM.init({
		driver: MongoDriver,
		dbName: 'dummy',
		entities,
		metadataProvider: ReflectMetadataProvider,
		allowGlobalContext: true,
	});
	return orm;
};
