import { BoardNodeEntity } from '@modules/board/repo/entity/board-node.entity';
import { LessonEntity } from '@modules/lesson/repo';
import { lessonFactory } from '@modules/lesson/testing';
import { Task } from '@modules/task/repo';
import { taskFactory } from '@modules/task/testing';
import { BaseFactory } from '@testing/factory/base.factory';
import { ColumnBoardBoardElement, LessonBoardElement, TaskBoardElement } from '../repo';
import { columnBoardEntityFactory } from '@modules/board/testing/entity/column-board-entity.factory';

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

export const columnboardBoardElementFactory = BaseFactory.define<ColumnBoardBoardElement, { target: BoardNodeEntity }>(
	ColumnBoardBoardElement,
	() => {
		const target = columnBoardEntityFactory.build();
		return { target };
	}
);
