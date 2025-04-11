import { LessonEntity } from '@modules/lesson/repo';
import { lessonFactory } from '@modules/lesson/testing';
import { Task } from '@modules/task/repo';
import { taskFactory } from '@modules/task/testing';
import { BaseFactory } from '@testing/factory/base.factory';
import { ColumnBoardBoardElement, ColumnBoardNode, LessonBoardElement, TaskBoardElement } from '../repo';
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
