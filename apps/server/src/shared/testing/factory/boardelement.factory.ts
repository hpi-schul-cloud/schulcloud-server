import { TaskBoardElement, LessonBoardElement, Task, Lesson } from '@shared/domain';
import { lessonFactory } from './lesson.factory';
import { BaseFactory } from './base.factory';
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
