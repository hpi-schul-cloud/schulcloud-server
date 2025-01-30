import { columnBoardNodeFactory } from '@modules/board/testing';
import { LegacyBoardElementType } from '@shared/domain/entity';
import { setupEntities } from '@testing/setup-entities';
import { ColumnBoardBoardElement } from './column-board-board-element.entity';

describe('ColumnBoardBoardElementEntity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		it('should have correct type', () => {
			const columnBoardTarget = columnBoardNodeFactory.build({ title: 'target' });

			const boardElement = new ColumnBoardBoardElement({ target: columnBoardTarget });

			expect(boardElement.boardElementType).toEqual(LegacyBoardElementType.ColumnBoard);
		});
	});
});
