import { BoardNodeType } from '@shared/domain';
import { cardNodeFactory, columnBoardNodeFactory, setupEntities } from '@shared/testing';
import {
	cardFactory,
	columnBoardFactory,
	columnFactory,
	textElementFactory,
} from '@shared/testing/factory/domainobject';
import { ObjectId } from 'bson';
import { BoardNodeBuilderImpl } from './board-node.builder-impl';

describe(BoardNodeBuilderImpl.name, () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('when building Columns', () => {
		const setup = () => {
			const columnBoard = columnBoardFactory.build();

			const builder = new BoardNodeBuilderImpl();

			return { builder, columnBoard };
		};

		it('should build a column boardNode', () => {
			const { builder, columnBoard } = setup();

			const boardNodes = builder.buildBoardNodes([columnBoard]);
			expect(boardNodes).toHaveLength(1);
			expect(boardNodes[0].id).toBe(columnBoard.id);
			expect(boardNodes[0].type).toBe(BoardNodeType.COLUMN_BOARD);
		});
	});

	describe('when building Columns', () => {
		const setup = () => {
			const column = columnFactory.build();
			const columnBoard = columnBoardFactory.build({ children: [column] });

			const builder = new BoardNodeBuilderImpl();

			return { builder, column, columnBoard };
		};

		it('should build a column boardNode', () => {
			const { builder, column, columnBoard } = setup();

			const boardNodes = builder.buildBoardNodes([column], columnBoard);
			expect(boardNodes).toHaveLength(1);
			expect(boardNodes[0].id).toBe(column.id);
			expect(boardNodes[0].type).toBe(BoardNodeType.COLUMN);
		});
	});

	describe('when building Cards', () => {
		const setup = () => {
			const elements = textElementFactory.buildList(3);
			const card = cardFactory.build({ children: elements });
			const column = columnFactory.build();

			const builder = new BoardNodeBuilderImpl();

			return { builder, card, column, elements };
		};

		it('should build a card boardnode', () => {
			const { builder, card, column } = setup();

			const boardNodes = builder.buildBoardNodes([card], column);
			expect(boardNodes[0].id).toBe(card.id);
			expect(boardNodes[0].type).toBe(BoardNodeType.CARD);
		});

		it('should build nodes for each element of the card', () => {
			const { builder, card, column, elements } = setup();

			const boardNodes = builder.buildBoardNodes([card], column);

			expect(boardNodes.length).toEqual(elements.length + 1);
			elements.forEach((currentElement) => {
				const foundElement = boardNodes.find((node) => node.id === currentElement.id);
				expect(foundElement).toBeDefined();
			});
		});
	});

	describe('when building TextElements', () => {
		const setup = () => {
			const textElement = textElementFactory.build();
			const card = cardFactory.build();

			const builder = new BoardNodeBuilderImpl();

			return { builder, textElement, card };
		};

		it('should build a text element boardnode', () => {
			const { builder, textElement, card } = setup();

			const boardNodes = builder.buildBoardNodes([textElement], card);
			expect(boardNodes).toHaveLength(1);
			expect(boardNodes[0].id).toBe(textElement.id);
			expect(boardNodes[0].type).toBe(BoardNodeType.TEXT_ELEMENT);
		});
	});

	describe('ensure board node type', () => {
		const setup = () => {
			const cardNode = cardNodeFactory.buildWithId();

			const builder = new BoardNodeBuilderImpl();

			return { builder, cardNode };
		};

		it('should do nothing if type is correct', () => {
			const { builder, cardNode } = setup();
			expect(() => builder.ensureBoardNodeType(cardNode, BoardNodeType.CARD)).not.toThrowError();
		});

		it('should do nothing if no boardNode was given', () => {
			const { builder } = setup();
			expect(() => builder.ensureBoardNodeType(undefined, BoardNodeType.CARD)).not.toThrowError();
		});

		it('should throw error if wrong type', () => {
			const { builder, cardNode } = setup();
			expect(() => builder.ensureBoardNodeType(cardNode, BoardNodeType.COLUMN)).toThrowError();
		});

		it('should do nothing if one of the valid types is met', () => {
			const { builder, cardNode } = setup();
			expect(() => builder.ensureBoardNodeType(cardNode, BoardNodeType.COLUMN, BoardNodeType.CARD)).not.toThrowError();
		});
	});

	describe('when getting a parent', () => {
		const setup = () => {
			const columnBoardNode = columnBoardNodeFactory.buildWithId();

			const builder = new BoardNodeBuilderImpl(columnBoardNode);

			return { builder, columnBoardNode };
		};

		it('should return the correct parent', () => {
			const { builder, columnBoardNode } = setup();

			expect(builder.getParent(columnBoardNode.id)).toBe(columnBoardNode);
		});

		it('should return undefined if the parent is unknown', () => {
			const { builder } = setup();
			const fakeId = new ObjectId().toHexString();
			expect(builder.getParent(fakeId)).toBeUndefined();
		});

		it('should return undefined if no parentid was given', () => {
			const { builder } = setup();
			expect(builder.getParent()).toBeUndefined();
		});
	});
});
