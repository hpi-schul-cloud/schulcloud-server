import { createMock } from '@golevelup/ts-jest';
import { columnBoardFactory, columnFactory } from '@shared/testing';
import { ColumnBoard } from './column-board.do';
import { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

describe(ColumnBoard.name, () => {
	describe('isAllowedAsChild', () => {
		it('should allow column objects', () => {
			const columnBoard = columnBoardFactory.build();
			const column = columnFactory.build();
			expect(columnBoard.isAllowedAsChild(column)).toBe(true);
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
