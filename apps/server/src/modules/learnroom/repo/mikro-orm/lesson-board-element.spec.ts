import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { LessonEntity } from '@modules/lesson/repository';
import { lessonFactory } from '@modules/lesson/testing';
import { Submission, Task } from '@modules/task/repo';
import { Material } from '@shared/domain/entity';
import { setupEntities } from '@testing/database';
import { LegacyBoardElementType } from './legacy-board-element.entity';
import { LessonBoardElement } from './lesson-board-element.entity';

describe('LessonBoardElementEntity', () => {
	beforeAll(async () => {
		await setupEntities([
			LessonBoardElement,
			LessonEntity,
			Material,
			CourseEntity,
			CourseGroupEntity,
			Task,
			Submission,
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
