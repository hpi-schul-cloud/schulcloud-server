import { AnyEntity, EntityClass, MikroORM } from '@mikro-orm/core';
import { ALL_ENTITIES } from '@shared/domain/entity';

/**
 * Test-Setup to make all entities available without a database connection.
 * @returns
 */
export const setupEntities = async (entities: EntityClass<AnyEntity>[] = ALL_ENTITIES): Promise<MikroORM> => {
	const orm = await MikroORM.init({
		type: 'mongo',
		dbName: 'dummy',
		entities,
		allowGlobalContext: true,
		connect: false,
	});
	return orm;
};
