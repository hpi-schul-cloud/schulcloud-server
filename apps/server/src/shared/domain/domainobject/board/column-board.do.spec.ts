import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { cardFactory, columnBoardFactory, columnFactory } from '@shared/testing';
import { ColumnBoard } from './column-board.do';
import { BoardCompositeVisitor, BoardCompositeVisitorAsync, BoardNodeBuilder } from './types';

describe(ColumnBoard.name, () => {
	describe('useBoardNodeBuilder', () => {
		const setup = () => {
			const board = columnBoardFactory.build();
			const builder: DeepMocked<BoardNodeBuilder> = createMock<BoardNodeBuilder>();

			return { board, builder };
		};

		it('should call the specific builder method', () => {
			const { board, builder } = setup();

			board.useBoardNodeBuilder(builder);

			expect(builder.buildColumnBoardNode).toHaveBeenCalledWith(board, undefined);
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

	describe('accept', () => {
		it('should call the right visitor method', () => {
			const visitor = createMock<BoardCompositeVisitor>();
			const columnBoard = columnBoardFactory.build();

			columnBoard.accept(visitor);

			expect(visitor.visitColumnBoard).toHaveBeenCalledWith(columnBoard);
		});
	});

	describe('acceptAsync', () => {
		it('should call the right async visitor method', async () => {
			const visitor = createMock<BoardCompositeVisitorAsync>();
			const columnBoard = columnBoardFactory.build();

			await columnBoard.acceptAsync(visitor);

			expect(visitor.visitColumnBoardAsync).toHaveBeenCalledWith(columnBoard);
		});
	});
});
