import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { lessonFactory } from '@modules/lesson/testing';
import { Submission, Task } from '@modules/task/repo';
import { UserLoginMigrationEntity } from '@modules/user-login-migration/repo';
import { setupEntities } from '@testing/database';
import { LegacyBoardElementType } from './legacy-board-element.entity';
import { LessonBoardElement } from './lesson-board-element.entity';

describe('LessonBoardElementEntity', () => {
	beforeAll(async () => {
		await setupEntities([
			CourseEntity,
			CourseGroupEntity,
			LessonBoardElement,
			LessonEntity,
			Material,
			SchoolSystemOptionsEntity,
			Submission,
			Task,
			UserLoginMigrationEntity,
		]);
	});

	describe('constructor', () => {
		it('should have correct type', () => {
			const lesson = lessonFactory.build();

			const boardElement = new LessonBoardElement({ target: lesson });

			expect(boardElement.boardElementType).toEqual(LegacyBoardElementType.Lesson);
		});
	});
});
