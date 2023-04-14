import { TaskBoardElement, LessonBoardElement, Task, Lesson } from '@shared/domain';
import { lessonFactory } from './lesson.factory';
import { BaseEntityTestFactory } from './base-entity-test.factory';
import { taskFactory } from './task.factory';

export const taskBoardElementFactory = BaseEntityTestFactory.define<TaskBoardElement, { target: Task }>(
	TaskBoardElement,
	() => {
		return {
			target: taskFactory.build(),
		};
	}
);

export const lessonBoardElementFactory = BaseEntityTestFactory.define<LessonBoardElement, { target: Lesson }>(
	LessonBoardElement,
	() => {
		return { target: lessonFactory.build() };
	}
);
