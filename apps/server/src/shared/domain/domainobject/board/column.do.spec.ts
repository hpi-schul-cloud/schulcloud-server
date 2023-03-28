import { BoardNodeBuilderImpl } from '@shared/domain/entity/boardnode/board-node-builder-impl';
import { boardFactory, cardFactory, columnBoardFactory, columnBoardNodeFactory, columnFactory } from '@shared/testing';
import { Column } from './column.do';

describe(Column.name, () => {
	const setup = () => {
		const column = columnFactory.build();
		const card = cardFactory.build();
		const boardNode = columnBoardNodeFactory.buildWithId();
		const builder = new BoardNodeBuilderImpl(boardNode);

		return { column, card, builder, parentId: boardNode.id };
	};

	it('should be able to add children', () => {
		const { column, card } = setup();

		column.addChild(card);

		expect(column.children[column.children.length - 1]).toEqual(card);
	});

	it('should call the specific builder method', () => {
		const { column, builder, parentId } = setup();
		jest.spyOn(builder, 'buildColumnNode');

		column.useBoardNodeBuilder(builder, parentId);

		expect(builder.buildColumnNode).toHaveBeenCalledWith(column, parentId, undefined);
	});

	describe('when adding a child', () => {
		it('should throw error on unsupported child type', () => {
			const { column } = setup();
			const board = columnBoardFactory.build();
			expect(() => column.addChild(board)).toThrowError();
		});
	});
});
