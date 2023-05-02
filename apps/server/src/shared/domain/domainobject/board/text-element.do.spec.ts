import { createMock } from '@golevelup/ts-jest';
import { textElementFactory } from '@shared/testing';
import { TextElement } from './text-element.do';
import { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

describe(TextElement.name, () => {
	describe('when trying to add a child to a text element', () => {
		it('should throw an error ', () => {
			const textElement = textElementFactory.build();
			const textElementChild = textElementFactory.build();

			expect(() => textElement.addChild(textElementChild)).toThrow();
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
