import {
	ColumnboardBoardElement,
	ColumnBoardNode,
	Lesson,
	LessonBoardElement,
	Task,
	TaskBoardElement,
} from '@shared/domain';
import { BaseFactory } from './base.factory';
import { columnBoardNodeFactory } from './boardnode';
import { lessonFactory } from './lesson.factory';
import { taskFactory } from './task.factory';

export const taskBoardElementFactory = BaseFactory.define<TaskBoardElement, { target: Task }>(TaskBoardElement, () => {
	return {
		target: taskFactory.build(),
	};
});

export const lessonBoardElementFactory = BaseFactory.define<LessonBoardElement, { target: Lesson }>(
	LessonBoardElement,
	() => {
		return { target: lessonFactory.build() };
	}
);

export const columnboardBoardElementFactory = BaseFactory.define<ColumnboardBoardElement, { target: ColumnBoardNode }>(
	ColumnboardBoardElement,
	() => {
		return { target: columnBoardNodeFactory.build() };
	}
);
