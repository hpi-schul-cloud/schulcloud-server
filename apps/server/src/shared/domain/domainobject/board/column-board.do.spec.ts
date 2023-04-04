import { createMock } from '@golevelup/ts-jest';
import { cardFactory, columnBoardFactory, columnFactory } from '@shared/testing';
import { ColumnBoard } from './column-board.do';
import { BoardNodeBuilder } from './types';

describe(ColumnBoard.name, () => {
	describe('useBoardNodeBuilder', () => {
		const setup = () => {
			const board = columnBoardFactory.build();
			const builder = createMock<BoardNodeBuilder>();

			return { board, builder };
		};

		it('should call the specific builder method', () => {
			const { board, builder } = setup();
			jest.spyOn(builder, 'buildColumnBoardNode');

			board.useBoardNodeBuilder(builder);

			expect(builder.buildColumnBoardNode).toHaveBeenCalledWith(board);
		});
	});

	describe('addChild', () => {
		const setup = () => {
			const children = columnFactory.buildListWithId(3);
			const board = columnBoardFactory.build({ children });
			const column = columnFactory.build();

			return { board, column };
		};

		it('should throw error on unsupported child type', () => {
			const { board } = setup();
			const card = cardFactory.build();
			expect(() => board.addChild(card)).toThrowError();
		});

		it('should be able to add children', () => {
			const { board, column } = setup();

			board.addChild(column);

			expect(board.children[board.children.length - 1]).toEqual(column);
		});

		it('should add child to correct position', () => {
			const { column, board } = setup();

			board.addChild(column, 1);

			expect(board.children[1]).toEqual(column);
		});
	});
});
