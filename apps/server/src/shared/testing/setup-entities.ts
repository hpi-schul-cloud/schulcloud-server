import { MikroORM } from '@mikro-orm/core';
import { ALL_ENTITIES } from '@shared/domain';

/**
 * Test-Setup to make all entities available without a database connection.
 * Teardown: 'await orm.close()' in after-hook!
 * @returns
 */
export const setupEntities = async (): Promise<MikroORM> => {
	const orm = await MikroORM.init({ type: 'mongo', dbName: 'dummy', entities: ALL_ENTITIES });
	return orm;
};
