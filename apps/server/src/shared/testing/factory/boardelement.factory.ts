import { ColumnboardBoardElement } from '@shared/domain/entity/legacy-board/column-board-boardelement';
import { ColumnBoardTarget } from '@shared/domain/entity/legacy-board/column-board-target.entity';
import { LessonBoardElement } from '@shared/domain/entity/legacy-board/lesson-boardelement.entity';
import { TaskBoardElement } from '@shared/domain/entity/legacy-board/task-boardelement.entity';
import { LessonEntity } from '@shared/domain/entity/lesson.entity';
import { Task } from '@shared/domain/entity/task.entity';
import { EntityId } from '@shared/domain/types/entity-id';
import { ObjectId } from 'bson';
import { BaseFactory } from './base.factory';
import { lessonFactory } from './lesson.factory';
import { taskFactory } from './task.factory';

export const taskBoardElementFactory = BaseFactory.define<TaskBoardElement, { target: Task }>(TaskBoardElement, () => {
	return {
		target: taskFactory.build(),
	};
});

export const lessonBoardElementFactory = BaseFactory.define<LessonBoardElement, { target: LessonEntity }>(
	LessonBoardElement,
	() => {
		return { target: lessonFactory.build() };
	}
);

export const columnBoardTargetFactory = BaseFactory.define<
	ColumnBoardTarget,
	{ columnBoardId: EntityId; title: string; published: boolean }
>(ColumnBoardTarget, ({ sequence }) => {
	return {
		columnBoardId: new ObjectId().toHexString(),
		title: `columnBoardTarget #${sequence}`,
		published: false,
	};
});

export const columnboardBoardElementFactory = BaseFactory.define<
	ColumnboardBoardElement,
	{ target: ColumnBoardTarget }
>(ColumnboardBoardElement, () => {
	const target = columnBoardTargetFactory.build();
	return { target };
});
