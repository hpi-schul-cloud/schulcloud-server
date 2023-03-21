import { BoardNodeBuilderImpl } from '@shared/domain/entity/boardnode/board-node-builder-impl';
import { cardFactory, columnNodeFactory, textElementFactory } from '@shared/testing';
import { Card } from './card.do';

describe(Card.name, () => {
	const setup = () => {
		const card = cardFactory.build();
		const element = textElementFactory.build();
		const columnNode = columnNodeFactory.buildWithId();
		const builder = new BoardNodeBuilderImpl(columnNode);

		return { card, element, builder, parentId: columnNode.id };
	};

	it('should be able to add children', () => {
		const { card, element } = setup();

		card.addElement(element);

		expect(card.elements[card.elements.length - 1]).toEqual(element);
	});

	it('should call the specific builder method', () => {
		const { card, builder, parentId } = setup();
		jest.spyOn(builder, 'buildCardNode');

		card.useBoardNodeBuilder(builder, parentId);

		expect(builder.buildCardNode).toHaveBeenCalledWith(card, parentId, undefined);
	});
});
