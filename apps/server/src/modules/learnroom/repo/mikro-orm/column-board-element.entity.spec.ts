import { columnBoardEntityFactory } from '@modules/board/testing/entity/column-board-entity.factory';
import { ColumnBoardBoardElement } from './column-board-board-element.entity';
import { LegacyBoardElementType } from './legacy-board-element.entity';

describe('ColumnBoardBoardElementEntity', () => {
	describe('constructor', () => {
		it('should have correct type', () => {
			const columnBoardTarget = columnBoardEntityFactory.build({ title: 'target' });

			const boardElement = new ColumnBoardBoardElement({ target: columnBoardTarget });

			expect(boardElement.boardElementType).toEqual(LegacyBoardElementType.ColumnBoard);
		});
	});
});
