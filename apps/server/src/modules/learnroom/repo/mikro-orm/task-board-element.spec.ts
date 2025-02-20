import { Course, CourseGroup } from '@modules/course/repo';
import { LessonEntity, Material, Submission, Task, User } from '@shared/domain/entity';
import { setupEntities } from '@testing/database';
import { taskFactory } from '@testing/factory/task.factory';
import { LegacyBoardElementType } from './legacy-board-element.entity';
import { TaskBoardElement } from './task-board-element.entity';

describe('TaskBoardElementEntity', () => {
	beforeAll(async () => {
		await setupEntities([User, Task, Submission, Course, CourseGroup, LessonEntity, Material]);
	});

	describe('constructor', () => {
		it('should have correct type', () => {
			const task = taskFactory.build();

			const boardElement = new TaskBoardElement({ target: task });

			expect(boardElement.boardElementType).toEqual(LegacyBoardElementType.Task);
		});
	});
});
