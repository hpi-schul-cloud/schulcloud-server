import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/mongodb';
import { BoardNodeType, CardNode, ColumnBoardNode, ColumnNode, FileElementNode, TextElementNode } from '@shared/domain';
import {
	cardFactory,
	columnBoardFactory,
	columnBoardNodeFactory,
	columnFactory,
	fileElementFactory,
	textElementFactory,
} from '@shared/testing';
import { RecursiveSaveVisitor } from './recursive-save.visitor';

describe(RecursiveSaveVisitor.name, () => {
	let visitor: RecursiveSaveVisitor;
	let em: DeepMocked<EntityManager>;

	beforeAll(() => {
		em = createMock<EntityManager>();
		visitor = new RecursiveSaveVisitor(em);
	});

	describe('when visiting a board composite', () => {
		it('should create or update the node', () => {
			const board = columnBoardFactory.build();
			jest.spyOn(visitor, 'createOrUpdateBoardNode');

			visitor.visitColumnBoard(board);

			const expectedNode: Partial<ColumnBoardNode> = {
				id: board.id,
				type: BoardNodeType.COLUMN_BOARD,
				title: board.title,
			};
			expect(visitor.createOrUpdateBoardNode).toHaveBeenCalledWith(expect.objectContaining(expectedNode));
		});

		it('should visit the children', () => {
			const column = columnFactory.build();
			jest.spyOn(column, 'accept');
			const board = columnBoardFactory.build({ children: [column] });

			board.accept(visitor);

			expect(column.accept).toHaveBeenCalledWith(visitor);
		});
	});

	describe('when visiting a column composite', () => {
		it('should create or update the node', () => {
			const column = columnFactory.build();
			jest.spyOn(visitor, 'createOrUpdateBoardNode');

			visitor.visitColumn(column);

			const expectedNode: Partial<ColumnNode> = {
				id: column.id,
				type: BoardNodeType.COLUMN,
				title: column.title,
			};
			expect(visitor.createOrUpdateBoardNode).toHaveBeenCalledWith(expect.objectContaining(expectedNode));
		});

		it('should visit the children', () => {
			const card = cardFactory.build();
			jest.spyOn(card, 'accept');
			const column = columnFactory.build({ children: [card] });

			column.accept(visitor);

			expect(card.accept).toHaveBeenCalledWith(visitor);
		});
	});

	describe('when visiting a card composite', () => {
		it('should create or update the node', () => {
			const card = cardFactory.build();
			jest.spyOn(visitor, 'createOrUpdateBoardNode');

			visitor.visitCard(card);

			const expectedNode: Partial<CardNode> = {
				id: card.id,
				type: BoardNodeType.CARD,
				height: card.height,
				title: card.title,
			};
			expect(visitor.createOrUpdateBoardNode).toHaveBeenCalledWith(expect.objectContaining(expectedNode));
		});

		it('should visit the children', () => {
			const textElement = textElementFactory.build();
			jest.spyOn(textElement, 'accept');
			const card = cardFactory.build({ children: [textElement] });

			card.accept(visitor);

			expect(textElement.accept).toHaveBeenCalledWith(visitor);
		});
	});

	describe('when visiting a text element composite', () => {
		it('should create or update the node', () => {
			const textElement = textElementFactory.build();
			jest.spyOn(visitor, 'createOrUpdateBoardNode');

			visitor.visitTextElement(textElement);

			const expectedNode: Partial<TextElementNode> = {
				id: textElement.id,
				type: BoardNodeType.TEXT_ELEMENT,
				text: textElement.text,
			};
			expect(visitor.createOrUpdateBoardNode).toHaveBeenCalledWith(expect.objectContaining(expectedNode));
		});
	});

	describe('when visiting a file element composite', () => {
		it('should create or update the node', () => {
			const fileElement = fileElementFactory.build();
			jest.spyOn(visitor, 'createOrUpdateBoardNode');

			visitor.visitFileElement(fileElement);

			const expectedNode: Partial<FileElementNode> = {
				id: fileElement.id,
				type: BoardNodeType.FILE_ELEMENT,
				caption: fileElement.caption,
			};
			expect(visitor.createOrUpdateBoardNode).toHaveBeenCalledWith(expect.objectContaining(expectedNode));
		});
	});

	describe('createOrUpdateBoardNode', () => {
		describe('when the board is new', () => {
			it('should persist the board node', () => {
				const board = columnBoardFactory.build();
				em.getUnitOfWork().getById.mockReturnValue(undefined);

				visitor.visitColumnBoard(board);

				expect(em.persist).toHaveBeenCalledWith(expect.any(ColumnBoardNode));
			});
		});

		describe('when the board is already persisted', () => {
			it('should persist the board node', () => {
				const board = columnBoardFactory.build();
				const boardNode = columnBoardNodeFactory.build();
				em.getUnitOfWork().getById.mockReturnValue(boardNode);

				visitor.visitColumnBoard(board);

				expect(em.assign).toHaveBeenCalledWith(boardNode, expect.any(ColumnBoardNode));
			});
		});
	});
});
