import { Course, CourseGroup } from '@modules/course/repo';
import { LessonEntity, Material, Submission, Task } from '@shared/domain/entity';
import { setupEntities } from '@testing/database';
import { lessonFactory } from '@testing/factory/lesson.factory';
import { LegacyBoardElementType } from './legacy-board-element.entity';
import { LessonBoardElement } from './lesson-board-element.entity';

describe('LessonBoardElementEntity', () => {
	beforeAll(async () => {
		await setupEntities([LessonBoardElement, LessonEntity, Material, Course, CourseGroup, Task, Submission]);
	});

	describe('constructor', () => {
		it('should have correct type', () => {
			const lesson = lessonFactory.build();

			const boardElement = new LessonBoardElement({ target: lesson });

			expect(boardElement.boardElementType).toEqual(LegacyBoardElementType.Lesson);
		});
	});
});
