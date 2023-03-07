import { cardNodeFactory, columnBoardNodeFactory, setupEntities, textElementNodeFactory } from '@shared/testing';
import { BoardDoBuilder } from './board-do.builder';

describe(BoardDoBuilder.name, () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('when building a card', () => {
		it('should work without descendants', () => {
			const cardNode = cardNodeFactory.build();

			const domainObject = new BoardDoBuilder().buildCard(cardNode);

			expect(domainObject.constructor.name).toBe('Card');
		});

		it('should throw error with wrong type of children', () => {
			const cardNode = cardNodeFactory.buildWithId();
			const boardNode = columnBoardNodeFactory.buildWithId({ parent: cardNode });

			expect(() => {
				new BoardDoBuilder([boardNode]).buildCard(cardNode);
			}).toThrowError();
		});

		it('should assign the children', () => {
			const cardNode = cardNodeFactory.buildWithId();
			const elementNode1 = textElementNodeFactory.buildWithId({ parent: cardNode });
			const elementNode2 = textElementNodeFactory.buildWithId({ parent: cardNode });

			const domainObject = new BoardDoBuilder([elementNode1, elementNode2]).buildCard(cardNode);

			expect(domainObject.elements.map((el) => el.id).sort()).toEqual([elementNode1.id, elementNode2.id].sort());
		});

		it('should sort the children by their node position', () => {
			const cardNode = cardNodeFactory.buildWithId();
			const elementNode1 = textElementNodeFactory.buildWithId({ parent: cardNode, position: 2 });
			const elementNode2 = textElementNodeFactory.buildWithId({ parent: cardNode, position: 3 });
			const elementNode3 = textElementNodeFactory.buildWithId({ parent: cardNode, position: 1 });

			const domainObject = new BoardDoBuilder([elementNode1, elementNode2, elementNode3]).buildCard(cardNode);

			const elementIds = domainObject.elements.map((el) => el.id);
			expect(elementIds).toEqual([elementNode3.id, elementNode1.id, elementNode2.id]);
		});
	});
});
