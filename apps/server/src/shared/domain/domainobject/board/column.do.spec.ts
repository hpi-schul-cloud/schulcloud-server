import { createMock } from '@golevelup/ts-jest';
import { cardFactory } from '@shared/testing/factory/domainobject/board/card.do.factory';
import { columnFactory } from '@shared/testing/factory/domainobject/board/column.do.factory';
import { Column } from './column.do';
import { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types/board-composite-visitor';

describe(Column.name, () => {
	describe('isAllowedAsChild', () => {
		it('should allow card objects', () => {
			const column = columnFactory.build();
			const card = cardFactory.build();
			expect(column.isAllowedAsChild(card)).toBe(true);
		});
	});

	describe('accept', () => {
		it('should call the right visitor method', () => {
			const visitor = createMock<BoardCompositeVisitor>();
			const column = columnFactory.build();

			column.accept(visitor);

			expect(visitor.visitColumn).toHaveBeenCalledWith(column);
		});
	});

	describe('acceptAsync', () => {
		it('should call the right async visitor method', async () => {
			const visitor = createMock<BoardCompositeVisitorAsync>();
			const column = columnFactory.build();

			await column.acceptAsync(visitor);

			expect(visitor.visitColumnAsync).toHaveBeenCalledWith(column);
		});
	});
});
