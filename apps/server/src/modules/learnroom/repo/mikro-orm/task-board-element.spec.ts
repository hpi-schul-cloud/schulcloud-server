import { taskFactory } from '@testing/factory/task.factory';
import { setupEntities } from '@testing/setup-entities';
import { LegacyBoardElementType } from './legacy-board-element.entity';
import { TaskBoardElement } from './task-board-element.entity';

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
