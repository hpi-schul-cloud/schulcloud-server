import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { Submission, Task } from '@modules/task/repo';
import { taskFactory } from '@modules/task/testing';
import { UserLoginMigrationEntity } from '@modules/user-login-migration/repo';
import { User } from '@modules/user/repo';
import { setupEntities } from '@testing/database';
import { LegacyBoardElementType } from './legacy-board-element.entity';
import { TaskBoardElement } from './task-board-element.entity';

describe('TaskBoardElementEntity', () => {
	beforeAll(async () => {
		await setupEntities([
			CourseEntity,
			CourseGroupEntity,
			LessonEntity,
			Material,
			SchoolSystemOptionsEntity,
			Submission,
			Task,
			User,
			UserLoginMigrationEntity,
		]);
	});

	describe('constructor', () => {
		it('should have correct type', () => {
			const task = taskFactory.build();

			const boardElement = new TaskBoardElement({ target: task });

			expect(boardElement.boardElementType).toEqual(LegacyBoardElementType.Task);
		});
	});
});
