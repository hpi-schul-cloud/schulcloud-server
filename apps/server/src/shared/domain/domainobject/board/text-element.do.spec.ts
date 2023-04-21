import { createMock } from '@golevelup/ts-jest';
import { cardFactory, textElementFactory } from '@shared/testing';
import { TextElement } from './text-element.do';
import { BoardNodeBuilder } from './types';

describe(TextElement.name, () => {
	const setup = () => {
		const element = textElementFactory.build();
		const card = cardFactory.build();
		const builder = createMock<BoardNodeBuilder>();

		return { element, builder, card };
	};

	it('should call the specific builder method', () => {
		const { element, builder, card } = setup();
		jest.spyOn(builder, 'buildTextElementNode');

		element.useBoardNodeBuilder(builder, card);

		expect(builder.buildTextElementNode).toHaveBeenCalledWith(element, card);
	});

	describe('when trying to add a child to a text element', () => {
		it('should throw an error ', () => {
			const textElement = textElementFactory.build();
			const textElementChild = textElementFactory.build();

			expect(() => textElement.addChild(textElementChild)).toThrow();
		});
	});
});
