import { AnyEntity, EntityClass, MikroORM } from '@mikro-orm/core';
import {
	ColumnBoardBoardElement,
	ColumnBoardNode,
	LegacyBoard,
	LegacyBoardElement,
	LessonBoardElement,
	TaskBoardElement,
} from '@modules/learnroom/repo';
import { ALL_ENTITIES } from '@shared/domain/entity';

/**
 * Test-Setup to make all entities available without a database connection.
 * @returns
 */
export const setupEntities = async (
	entities: EntityClass<AnyEntity>[] = [
		...ALL_ENTITIES,
		ColumnBoardBoardElement,
		ColumnBoardNode,
		LegacyBoard,
		LegacyBoardElement,
		LessonBoardElement,
		TaskBoardElement,
	]
): Promise<MikroORM> => {
	const orm = await MikroORM.init({
		type: 'mongo',
		dbName: 'dummy',
		entities,
		allowGlobalContext: true,
		connect: false,
	});
	return orm;
};
