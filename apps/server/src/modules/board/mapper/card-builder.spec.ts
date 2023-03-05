import { boardNodeFactory } from '@shared/testing';
import { CardBuilder } from './card-builder';

describe('CardBuilder', () => {
	describe('when converting a boardnode', () => {
		it('should build a Card-DO when a boardNode of type CARD is given', () => {
			const boardNode = boardNodeFactory.asCard().build();

			const domainObject = new CardBuilder().build(boardNode);

			expect(domainObject?.constructor.name).toBe('Card');
		});

		it('should throw error if the boardNode is not of type CARD', () => {
			const boardNode = boardNodeFactory.asColumn().build();

			expect(() => {
				new CardBuilder().build(boardNode);
			}).toThrowError();
		});
	});
});
