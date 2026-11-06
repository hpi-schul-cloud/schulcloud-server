import { type EntityClass, type MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeEntity } from '@modules/board/repo/entity';
import { CourseEntity } from '@modules/course/repo';
import { ColumnBoardBoardElement, LessonBoardElement, TaskBoardElement } from '@modules/learnroom/repo';
import { LessonEntity } from '@modules/lesson/repo';
import { CourseNews, SchoolNews, TeamNews } from '@modules/news/repo';
import { SchoolEntity } from '@modules/school/repo';
import { Task } from '@modules/task/repo';
import { TeamEntity } from '@modules/team/repo';
import { type BaseEntity } from '@shared/domain/entity';
import { setupEntities } from '@testing/database';
import { TEST_ENTITIES } from './management.entity.imports';

describe('Management entity metadata', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities(TEST_ENTITIES);
	});

	afterAll(async () => {
		await orm.close();
	});

	it.each<[EntityClass<BaseEntity & { target: BaseEntity }>, EntityClass<BaseEntity>]>([
		[SchoolNews, SchoolEntity],
		[CourseNews, CourseEntity],
		[TeamNews, TeamEntity],
		[TaskBoardElement, Task],
		[LessonBoardElement, LessonEntity],
		[ColumnBoardBoardElement, BoardNodeEntity],
	])('should preserve the target field and relation type for %s', (entityClass, targetClass) => {
		const metadata = orm.getMetadata().get(entityClass);
		const { discriminatorColumn } = metadata.root;
		if (!discriminatorColumn) {
			throw new Error(`Missing discriminator column for ${metadata.className}`);
		}
		const targetId = new ObjectId();
		const entity = orm.em.map(entityClass, {
			_id: new ObjectId(),
			target: targetId,
			[discriminatorColumn]: metadata.discriminatorValue,
		});

		expect(metadata.properties.target.fieldNames).toEqual(['target']);
		expect(metadata.properties.target.targetMeta?.class).toBe(targetClass);
		expect(entity.target).toBeInstanceOf(targetClass);
		expect(entity.target.id).toBe(targetId.toHexString());
	});
});
