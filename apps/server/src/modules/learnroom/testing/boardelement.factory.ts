import { ColumnBoardNode, LessonBoardElement, LessonEntity, Task, TaskBoardElement } from '@shared/domain/entity';
import { BaseFactory } from '@testing/factory/base.factory';
import { lessonFactory } from '@testing/factory/lesson.factory';
import { taskFactory } from '@testing/factory/task.factory';
import { ColumnBoardBoardElement } from '../repo';
import { columnBoardNodeFactory } from './column-board-node.factory';

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

export const columnboardBoardElementFactory = BaseFactory.define<ColumnBoardBoardElement, { target: ColumnBoardNode }>(
	ColumnBoardBoardElement,
	() => {
		const target = columnBoardNodeFactory.build();
		return { target };
	}
);
