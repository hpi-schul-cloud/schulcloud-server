import { createMock } from '@golevelup/ts-jest';
import { cardFactory, columnBoardFactory, columnFactory } from '@shared/testing';
import { Column } from './column.do';
import { BoardCompositeVisitor, BoardCompositeVisitorAsync, BoardNodeBuilder } from './types';

describe(Column.name, () => {
	describe('useBoardNodeBuilder', () => {
		const setup = () => {
			const column = columnFactory.build();
			const card = cardFactory.build();
			const board = columnBoardFactory.build();
			const builder = createMock<BoardNodeBuilder>();

			return { column, card, builder, board };
		};

		it('should call the specific builder method', () => {
			const { column, builder, board } = setup();
			jest.spyOn(builder, 'buildColumnNode');

			column.useBoardNodeBuilder(builder, board);

			expect(builder.buildColumnNode).toHaveBeenCalledWith(column, board);
		});
	});

	describe('addChild', () => {
		const setup = () => {
			const children = cardFactory.buildListWithId(3);
			const column = columnFactory.build({ children });
			const card = cardFactory.build();

			return { column, card };
		};

		describe('when adding a child', () => {
			it('should throw error on unsupported child type', () => {
				const { column } = setup();
				const board = columnBoardFactory.build();
				expect(() => column.addChild(board)).toThrowError();
			});

			it('should be able to add children', () => {
				const { column, card } = setup();

				column.addChild(card);

				expect(column.children[column.children.length - 1]).toEqual(card);
			});

			it('should add child to correct position', () => {
				const { column, card } = setup();

				column.addChild(card, 1);

				expect(column.children[1]).toEqual(card);
			});
		});

		it('should be able to add children', () => {
			const { column, card } = setup();

			column.addChild(card);

			expect(column.children[column.children.length - 1]).toEqual(card);
		});

		it('should add child to correct position', () => {
			const { column, card } = setup();

			column.addChild(card, 1);

			expect(column.children[1]).toEqual(card);
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
