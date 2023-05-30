import {
	ColumnboardBoardElement,
	ColumnBoardTarget,
	Lesson,
	LessonBoardElement,
	Task,
	TaskBoardElement,
} from '@shared/domain';
import { ObjectId } from 'bson';
import { BaseFactory } from './base.factory';
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

export const columnboardBoardElementFactory = BaseFactory.define<
	ColumnboardBoardElement,
	{ target: ColumnBoardTarget }
>(ColumnboardBoardElement, () => {
	return { target: new ColumnBoardTarget({ columnBoardId: new ObjectId().toHexString() }) };
});
