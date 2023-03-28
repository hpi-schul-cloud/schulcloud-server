import { BoardNodeBuilderImpl } from '@shared/domain/entity/boardnode/board-node-builder-impl';
import { cardNodeFactory, textElementFactory } from '@shared/testing';
import { TextElement } from './text-element.do';

describe(TextElement.name, () => {
	const setup = () => {
		const element = textElementFactory.build();
		const cardNode = cardNodeFactory.buildWithId();
		const builder = new BoardNodeBuilderImpl(cardNode);

		return { element, builder, parentId: cardNode.id };
	};

	it('should call the specific builder method', () => {
		const { element, builder, parentId } = setup();
		jest.spyOn(builder, 'buildTextElementNode');

		element.useBoardNodeBuilder(builder, parentId);

		expect(builder.buildTextElementNode).toHaveBeenCalledWith(element, parentId, undefined);
	});

	describe('when trying to add a child to a text element', () => {
		it('should throw an error ', () => {
			const textElement = textElementFactory.build();
			const textElementChild = textElementFactory.build();

			expect(() => textElement.addChild(textElementChild)).toThrow();
		});
	});
});
