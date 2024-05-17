import { columnBoardNodeFactory, lessonFactory, setupEntities, taskFactory } from '@shared/testing';
import { ColumnboardBoardElement } from './column-board-boardelement';
import { LegacyBoardElementType } from './legacy-boardelement.entity';
import { LessonBoardElement } from './lesson-boardelement.entity';
import { TaskBoardElement } from './task-boardelement.entity';

describe('TaskBoardElementEntity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		it('should have correct type', () => {
			const task = taskFactory.build();

			const boardElement = new TaskBoardElement({ target: task });

			expect(boardElement.boardElementType).toEqual(LegacyBoardElementType.Task);
		});
	});
});

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

describe('ColumnboardBoardElementEntity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		it('should have correct type', () => {
			const columnBoardTarget = columnBoardNodeFactory.build({ title: 'target' });

			const boardElement = new ColumnboardBoardElement({ target: columnBoardTarget });

			expect(boardElement.boardElementType).toEqual(LegacyBoardElementType.ColumnBoard);
		});
	});
});
