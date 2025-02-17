import { columnBoardNodeFactory } from '../../testing';
import { ColumnBoardBoardElement } from './column-board-board-element.entity';
import { LegacyBoardElementType } from './legacy-board-element.entity';

describe('ColumnBoardBoardElementEntity', () => {
	describe('constructor', () => {
		it('should have correct type', () => {
			const columnBoardTarget = columnBoardNodeFactory.build({ title: 'target' });

			const boardElement = new ColumnBoardBoardElement({ target: columnBoardTarget });

			expect(boardElement.boardElementType).toEqual(LegacyBoardElementType.ColumnBoard);
		});
	});
});
