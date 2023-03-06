import { columnBoardNodeFactory, textElementNodeFactory } from '@shared/testing';
import { TextElementBuilder } from './text-element-builder';

describe('TextElementBuilder', () => {
	describe('when converting a boardnode', () => {
		it('should build a ContentElement-DO when a boardNode of type ELEMENT is given', () => {
			const boardNode = textElementNodeFactory.build();

			const domainObject = new TextElementBuilder().build(boardNode);

			expect(domainObject.constructor.name).toBe('TextElement');
		});

		it('should throw error if the boardNode is not of type ELEMENT', () => {
			const boardNode = columnBoardNodeFactory.build();

			expect(() => {
				new TextElementBuilder().build(boardNode);
			}).toThrowError();
		});
	});
});
