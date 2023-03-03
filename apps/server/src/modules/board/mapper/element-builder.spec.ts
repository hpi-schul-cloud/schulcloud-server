import { boardNodeFactory } from '@shared/testing/factory/boardnode.factory';
import { ElementBuilder } from './element-builder';

describe('ElementBuilder', () => {
	describe('when converting a boardnode', () => {
		it('should build a ContentElement-DO when a boardNode of type ELEMENT is given', () => {
			const boardNode = boardNodeFactory.asElement().build();

			const domainObject = ElementBuilder.build(boardNode);

			expect(domainObject?.constructor.name).toBe('ContentElement');
		});

		it('should return undefined if the boardNode is not of type ELEMENT', () => {
			const boardNode = boardNodeFactory.asColumn().build();

			const domainObject = ElementBuilder.build(boardNode);

			expect(domainObject).toBe(undefined);
		});
	});
});
