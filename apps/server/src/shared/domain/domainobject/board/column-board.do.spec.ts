import { createMock } from '@golevelup/ts-jest';
import { columnBoardFactory } from '@shared/testing/factory/domainobject/board/column-board.do.factory';
import { columnFactory } from '@shared/testing/factory/domainobject/board/column.do.factory';

import { ObjectId } from 'bson';
import { ColumnBoard } from './column-board.do';
import { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types/board-composite-visitor';
import { BoardExternalReferenceType } from './types/board-external-reference';

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

	describe('set context', () => {
		it('should store context', () => {
			const columnBoard = columnBoardFactory.build();

			const context = { type: BoardExternalReferenceType.Course, id: new ObjectId().toHexString() };
			columnBoard.context = { ...context };

			expect(columnBoard.context).toEqual(context);
		});
	});
});
