import { lessonFactory } from '@testing/factory/lesson.factory';
import { setupEntities } from '@testing/setup-entities';
import { LegacyBoardElementType } from './legacy-boardelement.entity';
import { LessonBoardElement } from './lesson-boardelement.entity';

describe('LessonBoardElementEntity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		it('should have correct type', () => {
			const lesson = lessonFactory.build();

			const boardElement = new LessonBoardElement({ target: lesson });

			expect(boardElement.boardElementType).toEqual(LegacyBoardElementType.Lesson);
		});
	});
});
