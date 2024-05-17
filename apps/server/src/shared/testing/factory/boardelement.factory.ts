import {
	ColumnboardBoardElement,
	ColumnBoardNode,
	LessonBoardElement,
	LessonEntity,
	Task,
	TaskBoardElement,
} from '@shared/domain/entity';
import { BaseFactory } from './base.factory';
import { columnBoardNodeFactory } from './column-board-node.factory';
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

export const columnboardBoardElementFactory = BaseFactory.define<ColumnboardBoardElement, { target: ColumnBoardNode }>(
	ColumnboardBoardElement,
	() => {
		const target = columnBoardNodeFactory.build();
		return { target };
	}
);
