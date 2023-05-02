import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { cardFactory, columnBoardFactory, columnFactory } from '@shared/testing';
import { Column } from './column.do';
import { BoardNodeBuilder } from './types';

describe(Column.name, () => {
	describe('useBoardNodeBuilder', () => {
		const setup = () => {
			const column = columnFactory.build();
			const card = cardFactory.build();
			const board = columnBoardFactory.build();
			const builder: DeepMocked<BoardNodeBuilder> = createMock<BoardNodeBuilder>();

			return { column, card, builder, board };
		};

		it('should call the specific builder method', () => {
			const { column, builder, board } = setup();

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
});
