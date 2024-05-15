import { createMock } from '@golevelup/ts-jest';
import { richTextElementFactory } from '@shared/testing/factory';
import { RichTextElement } from './rich-text-element.do';
import { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

describe(RichTextElement.name, () => {
	describe('when trying to add a child to a rich text element', () => {
		it('should throw an error ', () => {
			const richTextElement = richTextElementFactory.build();
			const richTextElementChild = richTextElementFactory.build();

			expect(() => richTextElement.addChild(richTextElementChild)).toThrow();
		});
	});

	describe('accept', () => {
		it('should call the right visitor method', () => {
			const visitor = createMock<BoardCompositeVisitor>();
			const richTextElement = richTextElementFactory.build();

			richTextElement.accept(visitor);

			expect(visitor.visitRichTextElement).toHaveBeenCalledWith(richTextElement);
		});
	});

	describe('acceptAsync', () => {
		it('should call the right async visitor method', async () => {
			const visitor = createMock<BoardCompositeVisitorAsync>();
			const richTextElement = richTextElementFactory.build();

			await richTextElement.acceptAsync(visitor);

			expect(visitor.visitRichTextElementAsync).toHaveBeenCalledWith(richTextElement);
		});
	});
});
