import { boardNodeFactory } from '@shared/testing/factory/boardnode.factory';
import { CardBuilder } from './card-builder';

describe('CardBuilder', () => {
	describe('when converting a boardnode', () => {
		it('should build a Card-DO when a boardNode of type CARD is given', () => {
			const boardNode = boardNodeFactory.asCard().build();

			const domainObject = CardBuilder.build(boardNode);

			expect(domainObject?.constructor.name).toBe('Card');
		});

		it('should return undefined if the boardNode is not of type CARD', () => {
			const boardNode = boardNodeFactory.asColumn().build();

			const domainObject = CardBuilder.build(boardNode);

			expect(domainObject).toBe(undefined);
		});
	});
});
