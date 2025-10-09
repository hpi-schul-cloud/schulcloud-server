import { AnyEntity, EntityClass, MikroORM } from '@mikro-orm/core';
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
		allowGlobalContext: true,
		connect: false,
	});
	return orm;
};
