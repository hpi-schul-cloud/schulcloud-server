import { columnBoardTargetFactory, lessonFactory, setupEntities, taskFactory } from '@shared/testing';
import { BoardElementType } from './boardelement.entity';
import { ColumnboardBoardElement } from './column-board-boardelement';
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
			const columnBoardTarget = columnBoardTargetFactory.build({ title: 'target', published: true });

			const boardElement = new ColumnboardBoardElement({ target: columnBoardTarget });

			expect(boardElement.boardElementType).toEqual(BoardElementType.ColumnBoard);
		});
	});
});
