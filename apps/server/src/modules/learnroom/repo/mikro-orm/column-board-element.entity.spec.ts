import { setupEntities } from '@testing/setup-entities';
import { columnBoardNodeFactory } from '../../testing';
import { ColumnBoardBoardElement } from './column-board-board-element.entity';
import { LegacyBoardElementType } from './legacy-boardelement.entity';

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
