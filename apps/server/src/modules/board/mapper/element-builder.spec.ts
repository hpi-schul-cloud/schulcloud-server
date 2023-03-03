import { boardNodeFactory } from '@shared/testing/factory/boardnode.factory';
import { ElementBuilder } from './element-builder';

describe('ElementBuilder', () => {
	describe('when converting a boardnode', () => {
		it('should build a ContentElement-DO when a boardNode of type ELEMENT is given', () => {
			const boardNode = boardNodeFactory.asElement().build();

			const domainObject = new ElementBuilder().build(boardNode);

			expect(domainObject.constructor.name).toBe('ContentElement');
		});

		it('should throw error if the boardNode is not of type ELEMENT', () => {
			const boardNode = boardNodeFactory.asColumn().build();

			expect(() => {
				new ElementBuilder().build(boardNode);
			}).toThrowError();
		});
	});
});
