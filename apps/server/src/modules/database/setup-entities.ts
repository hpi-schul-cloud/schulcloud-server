import { MikroORM } from '@mikro-orm/core';
import { ALL_ENTITIES } from '@shared/domain';

export const setupEntities = async (): Promise<MikroORM> => {
	const orm = await MikroORM.init({ type: 'mongo', dbName: 'dummy', entities: ALL_ENTITIES });
	return orm;
};
