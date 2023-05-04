import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { cardFactory, textElementFactory } from '@shared/testing';
import { TextElement } from './text-element.do';
import { BoardCompositeVisitor, BoardCompositeVisitorAsync, BoardNodeBuilder } from './types';

describe(TextElement.name, () => {
	describe('useBoardNodeBuilder', () => {
		describe('when trying to add a child to a text element', () => {
			const setup = () => {
				const element = textElementFactory.build();
				const card = cardFactory.build();
				const builder: DeepMocked<BoardNodeBuilder> = createMock<BoardNodeBuilder>();

				return { element, builder, card };
			};

			it('should call the specific builder method', () => {
				const { element, builder, card } = setup();

				element.useBoardNodeBuilder(builder, card);

				expect(builder.buildTextElementNode).toHaveBeenCalledWith(element, card);
			});
		});

		describe('when trying to add an invalid element', () => {
			const setup = () => {
				const textElement = textElementFactory.build();
				const textElementChild = textElementFactory.build();

				return { textElement, textElementChild };
			};

			it('should throw an error ', () => {
				const { textElement, textElementChild } = setup();

				expect(() => textElement.addChild(textElementChild)).toThrow();
			});
		});
	});

	describe('accept', () => {
		it('should call the right visitor method', () => {
			const visitor = createMock<BoardCompositeVisitor>();
			const textElement = textElementFactory.build();

			textElement.accept(visitor);

			expect(visitor.visitTextElement).toHaveBeenCalledWith(textElement);
		});
	});

	describe('acceptAsync', () => {
		it('should call the right async visitor method', async () => {
			const visitor = createMock<BoardCompositeVisitorAsync>();
			const textElement = textElementFactory.build();

			await textElement.acceptAsync(visitor);

			expect(visitor.visitTextElementAsync).toHaveBeenCalledWith(textElement);
		});
	});
});
