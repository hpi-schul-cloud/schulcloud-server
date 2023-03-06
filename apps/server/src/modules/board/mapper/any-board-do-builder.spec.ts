import { Card } from '@shared/domain';
import { cardNodeFactory, columnBoardNodeFactory, setupEntities, textElementNodeFactory } from '@shared/testing';
import { AnyBoardDoBuilder } from './any-board-do-builder';
import { CardBuilder } from './card-builder';

describe('CardBuilder', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('when converting a boardnode', () => {
		it('should build a Card-DO when a boardNode of type CARD is given', () => {
			const boardNode = cardNodeFactory.build();

			const domainObject = new CardBuilder().build(boardNode);

			expect(domainObject.constructor.name).toBe('Card');
		});

		it('should throw error if the boardNode is not of type CARD', () => {
			const boardNode = columnBoardNodeFactory.build();

			expect(() => {
				new CardBuilder().build(boardNode);
			}).toThrowError();
		});
	});

	describe('when converting a card-boardnode and some of its descendants', () => {
		it('should have the children correctly assigned in the card', () => {
			const card = cardNodeFactory.buildWithId();
			const childElement1 = textElementNodeFactory.build({ parent: card });
			const childElement2 = textElementNodeFactory.build({ parent: card });

			const domainObject = new AnyBoardDoBuilder().buildTree(card, [childElement1, childElement2]) as Card;

			expect(domainObject.elements).toHaveLength(2);
		});

		it('should not assign elements that are not part of the tree independent', () => {
			const card = cardNodeFactory.buildWithId();
			const independenElement = textElementNodeFactory.build();
			const element1 = textElementNodeFactory.build({ parent: card });
			const element2 = textElementNodeFactory.build({ parent: card });

			const domainObject = new AnyBoardDoBuilder().buildTree(card, [element1, independenElement, element2]) as Card;

			expect(domainObject.elements).toHaveLength(2);
		});

		it('should sort children according to position attribute', () => {
			const card = cardNodeFactory.buildWithId();
			const element1 = textElementNodeFactory.buildWithId({ parent: card, position: 3 });
			const element2 = textElementNodeFactory.buildWithId({ parent: card, position: 1 });
			const element3 = textElementNodeFactory.buildWithId({ parent: card, position: 2 });

			const domainObject = new AnyBoardDoBuilder().buildTree(card, [element1, element2, element3]) as Card;

			expect(domainObject.elements).toHaveLength(3);
			expect(domainObject.elements[0].id).toBe(element2.id);
			expect(domainObject.elements[1].id).toBe(element3.id);
			expect(domainObject.elements[2].id).toBe(element1.id);
		});
	});
});
