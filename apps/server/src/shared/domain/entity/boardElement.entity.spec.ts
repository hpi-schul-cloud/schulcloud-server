import { columnBoardFactory, lessonFactory, setupEntities, taskFactory } from '@shared/testing';
import { BoardElementType } from '.';
import { ColumnboardBoardElement, LessonBoardElement, TaskBoardElement } from './boardelement.entity';

describe('TaskBoardElementEntity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		it('should have correct type', () => {
			const task = taskFactory.build();

			const boardElement = new TaskBoardElement({ target: task });

			expect(boardElement.boardElementType).toEqual(BoardElementType.Task);
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

			expect(boardElement.boardElementType).toEqual(BoardElementType.Lesson);
		});
	});
});

describe('ColumnboardBoardElementEntity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		it('should have correct type', () => {
			const columnBoard = columnBoardFactory.build();

			const boardElement = new ColumnboardBoardElement({ target: columnBoard });

			expect(boardElement.boardElementType).toEqual(BoardElementType.ColumnBoard);
		});
	});
});
