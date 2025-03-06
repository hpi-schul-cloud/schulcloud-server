import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { LessonEntity } from '@modules/lesson/repository';
import { Task } from '@modules/task/repo';
import { User } from '@modules/user/repo';
import { Material, Submission } from '@shared/domain/entity';
import { setupEntities } from '@testing/database';
import { taskFactory } from '@testing/factory/task.factory';
import { LegacyBoardElementType } from './legacy-board-element.entity';
import { TaskBoardElement } from './task-board-element.entity';

describe('TaskBoardElementEntity', () => {
	beforeAll(async () => {
		await setupEntities([User, Task, Submission, CourseEntity, CourseGroupEntity, LessonEntity, Material]);
	});

	describe('constructor', () => {
		it('should have correct type', () => {
			const task = taskFactory.build();

			const boardElement = new TaskBoardElement({ target: task });

			expect(boardElement.boardElementType).toEqual(LegacyBoardElementType.Task);
		});
	});
});
