import { BoardNodeBuilderImpl } from '@shared/domain/entity/boardnode/board-node-builder-impl';
import { cardFactory, columnBoardNodeFactory, columnFactory } from '@shared/testing';
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

		column.addCard(card);

		expect(column.children[column.children.length - 1]).toEqual(card);
	});

	it('should call the specific builder method', () => {
		const { column, builder, parentId } = setup();
		jest.spyOn(builder, 'buildColumnNode');

		column.useBoardNodeBuilder(builder, parentId);

		expect(builder.buildColumnNode).toHaveBeenCalledWith(column, parentId, undefined);
	});
});
