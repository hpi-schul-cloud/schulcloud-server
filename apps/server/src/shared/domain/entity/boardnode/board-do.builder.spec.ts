import {
	cardNodeFactory,
	columnBoardNodeFactory,
	columnNodeFactory,
	setupEntities,
	textElementNodeFactory,
} from '@shared/testing';
import { BoardDoBuilder } from './board-do.builder';
import { BoardNodeType } from './types';

describe(BoardDoBuilder.name, () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('when building a column board', () => {
		it('should work without descendants', () => {
			const columnBoardNode = columnBoardNodeFactory.build();

			const domainObject = new BoardDoBuilder().buildColumnBoard(columnBoardNode);

			expect(domainObject.constructor.name).toBe('ColumnBoard');
		});

		it('should throw error with wrong type of children', () => {
			const columnBoardNode1 = columnBoardNodeFactory.buildWithId();
			const columnBoardNode2 = columnBoardNodeFactory.buildWithId({ parent: columnBoardNode1 });

			expect(() => {
				new BoardDoBuilder([columnBoardNode2]).buildColumnBoard(columnBoardNode1);
			}).toThrowError();
		});

		it('should assign the children', () => {
			const columnBoardNode = columnBoardNodeFactory.buildWithId();
			const columnNode1 = columnNodeFactory.buildWithId({ parent: columnBoardNode });
			const columnNode2 = columnNodeFactory.buildWithId({ parent: columnBoardNode });

			const domainObject = new BoardDoBuilder([columnNode1, columnNode2]).buildColumnBoard(columnBoardNode);

			expect(domainObject.children.map((el) => el.id).sort()).toEqual([columnNode1.id, columnNode2.id]);
		});

		it('should sort the children by their node position', () => {
			const columnBoardNode = columnBoardNodeFactory.buildWithId();
			const columnNode1 = columnNodeFactory.buildWithId({ parent: columnBoardNode, position: 3 });
			const columnNode2 = columnNodeFactory.buildWithId({ parent: columnBoardNode, position: 2 });
			const columnNode3 = columnNodeFactory.buildWithId({ parent: columnBoardNode, position: 1 });

			const domainObject = new BoardDoBuilder([columnNode1, columnNode2, columnNode3]).buildColumnBoard(
				columnBoardNode
			);

			const elementIds = domainObject.children.map((el) => el.id);
			expect(elementIds).toEqual([columnNode3.id, columnNode2.id, columnNode1.id]);
		});

		it('should be able to use the builder', () => {
			const columnBoardNode = columnBoardNodeFactory.buildWithId();
			const builder = new BoardDoBuilder();
			const domainObject = columnBoardNode.useDoBuilder(builder);
			expect(domainObject.id).toEqual(columnBoardNode.id);
		});
	});

	describe('when building a column', () => {
		it('should work without descendants', () => {
			const columnNode = columnNodeFactory.build();

			const domainObject = new BoardDoBuilder().buildColumn(columnNode);

			expect(domainObject.constructor.name).toBe('Column');
		});

		it('should throw error with wrong type of children', () => {
			const columnNode1 = columnNodeFactory.buildWithId();
			const columnNode2 = columnNodeFactory.buildWithId({ parent: columnNode1 });

			expect(() => {
				new BoardDoBuilder([columnNode2]).buildColumn(columnNode1);
			}).toThrowError();
		});

		it('should assign the children', () => {
			const columnNode = columnNodeFactory.buildWithId();
			const cardNode1 = cardNodeFactory.buildWithId({ parent: columnNode });
			const cardNode2 = cardNodeFactory.buildWithId({ parent: columnNode });

			const domainObject = new BoardDoBuilder([cardNode1, cardNode2]).buildColumn(columnNode);

			expect(domainObject.children.map((el) => el.id).sort()).toEqual([cardNode1.id, cardNode2.id]);
		});

		it('should sort the children by their node position', () => {
			const columnNode = columnNodeFactory.buildWithId();
			const cardNode1 = cardNodeFactory.buildWithId({ parent: columnNode, position: 3 });
			const cardNode2 = cardNodeFactory.buildWithId({ parent: columnNode, position: 2 });
			const cardNode3 = cardNodeFactory.buildWithId({ parent: columnNode, position: 1 });

			const domainObject = new BoardDoBuilder([cardNode1, cardNode2, cardNode3]).buildColumn(columnNode);

			const cardIds = domainObject.children.map((el) => el.id);
			expect(cardIds).toEqual([cardNode3.id, cardNode2.id, cardNode1.id]);
		});
	});

	describe('when building a card', () => {
		it('should work without descendants', () => {
			const cardNode = cardNodeFactory.build();

			const domainObject = new BoardDoBuilder().buildCard(cardNode);

			expect(domainObject.constructor.name).toBe('Card');
		});

		it('should throw error with wrong type of children', () => {
			const cardNode = cardNodeFactory.buildWithId();
			const columnNode = columnNodeFactory.buildWithId({ parent: cardNode });

			expect(() => {
				new BoardDoBuilder([columnNode]).buildCard(cardNode);
			}).toThrowError();
		});

		it('should assign the children', () => {
			const cardNode = cardNodeFactory.buildWithId();
			const elementNode1 = textElementNodeFactory.buildWithId({ parent: cardNode });
			const elementNode2 = textElementNodeFactory.buildWithId({ parent: cardNode });

			const domainObject = new BoardDoBuilder([elementNode1, elementNode2]).buildCard(cardNode);

			expect(domainObject.children.map((el) => el.id).sort()).toEqual([elementNode1.id, elementNode2.id]);
		});

		it('should sort the children by their node position', () => {
			const cardNode = cardNodeFactory.buildWithId();
			const elementNode1 = textElementNodeFactory.buildWithId({ parent: cardNode, position: 2 });
			const elementNode2 = textElementNodeFactory.buildWithId({ parent: cardNode, position: 3 });
			const elementNode3 = textElementNodeFactory.buildWithId({ parent: cardNode, position: 1 });

			const domainObject = new BoardDoBuilder([elementNode1, elementNode2, elementNode3]).buildCard(cardNode);

			const elementIds = domainObject.children.map((el) => el.id);
			expect(elementIds).toEqual([elementNode3.id, elementNode1.id, elementNode2.id]);
		});
	});

	describe('when building an text element', () => {
		it('should work without descendants', () => {
			const textElementNode = textElementNodeFactory.build();

			const domainObject = new BoardDoBuilder().buildTextElement(textElementNode);

			expect(domainObject.constructor.name).toBe('TextElement');
		});

		it('should throw error if textElement is not a leaf', () => {
			const textElementNode = textElementNodeFactory.buildWithId();
			const columnNode = columnNodeFactory.buildWithId({ parent: textElementNode });

			expect(() => {
				new BoardDoBuilder([columnNode]).buildTextElement(textElementNode);
			}).toThrowError();
		});
	});

	describe('ensure board node types', () => {
		it('should do nothing if type is correct', () => {
			const card = cardNodeFactory.build();
			expect(() => new BoardDoBuilder().ensureBoardNodeType(card, BoardNodeType.CARD)).not.toThrowError();
		});

		it('should do nothing if one of the types is correct', () => {
			const card = cardNodeFactory.build();
			expect(() =>
				new BoardDoBuilder().ensureBoardNodeType(card, [BoardNodeType.COLUMN, BoardNodeType.CARD])
			).not.toThrowError();
		});

		it('should throw error if wrong type', () => {
			const card = cardNodeFactory.build();
			expect(() => new BoardDoBuilder().ensureBoardNodeType(card, BoardNodeType.COLUMN)).toThrowError();
		});

		it('should throw error if one of multiple board nodes has the wrong type', () => {
			const column = columnNodeFactory.build();
			const card = cardNodeFactory.build();
			expect(() => new BoardDoBuilder().ensureBoardNodeType([card, column], BoardNodeType.COLUMN)).toThrowError();
		});
	});

	it('should delegate to the board node', () => {
		const textElementNode = textElementNodeFactory.build();
		jest.spyOn(textElementNode, 'useDoBuilder');

		const builder = new BoardDoBuilder();
		builder.buildDomainObject(textElementNode);

		expect(textElementNode.useDoBuilder).toHaveBeenCalledWith(builder);
	});
});
