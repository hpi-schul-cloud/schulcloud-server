import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { cardFactory, textElementFactory } from '@shared/testing';
import { TextElement } from './text-element.do';
import { BoardNodeBuilder } from './types';

describe(TextElement.name, () => {
	describe('useBoardNodeBuilder', () => {
		const setup = () => {
			const element = textElementFactory.build();
			const card = cardFactory.build();
			const builder: DeepMocked<BoardNodeBuilder> = createMock<BoardNodeBuilder>();

			return { element, builder, card };
		};

		describe('when trying to add a child to a text element', () => {
			it('should call the specific builder method', () => {
				const { element, builder, card } = setup();

				element.useBoardNodeBuilder(builder, card);

				expect(builder.buildTextElementNode).toHaveBeenCalledWith(element, card);
			});

			it('should throw an error ', () => {
				const textElement = textElementFactory.build();
				const textElementChild = textElementFactory.build();

				expect(() => textElement.addChild(textElementChild)).toThrow();
			});
		});
	});
});
