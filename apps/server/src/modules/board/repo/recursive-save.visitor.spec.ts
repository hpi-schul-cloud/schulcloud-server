import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/mongodb';
import { CardNode } from '@shared/domain/entity/boardnode/card-node.entity';
import { ColumnBoardNode } from '@shared/domain/entity/boardnode/column-board-node.entity';
import { ColumnNode } from '@shared/domain/entity/boardnode/column-node.entity';
import { ExternalToolElementNodeEntity } from '@shared/domain/entity/boardnode/external-tool-element-node.entity';
import { FileElementNode } from '@shared/domain/entity/boardnode/file-element-node.entity';
import { LinkElementNode } from '@shared/domain/entity/boardnode/link-element-node.entity';
import { RichTextElementNode } from '@shared/domain/entity/boardnode/rich-text-element-node.entity';
import { SubmissionContainerElementNode } from '@shared/domain/entity/boardnode/submission-container-element-node.entity';
import { SubmissionItemNode } from '@shared/domain/entity/boardnode/submission-item-node.entity';
import { BoardNodeType } from '@shared/domain/entity/boardnode/types/board-node-type';
import { columnBoardNodeFactory } from '@shared/testing/factory/boardnode/column-board-node.factory';
import { contextExternalToolEntityFactory } from '@shared/testing/factory/context-external-tool-entity.factory';
import { cardFactory } from '@shared/testing/factory/domainobject/board/card.do.factory';
import { columnBoardFactory } from '@shared/testing/factory/domainobject/board/column-board.do.factory';
import { columnFactory } from '@shared/testing/factory/domainobject/board/column.do.factory';
import { externalToolElementFactory } from '@shared/testing/factory/domainobject/board/external-tool.do.factory';
import { fileElementFactory } from '@shared/testing/factory/domainobject/board/file-element.do.factory';
import { linkElementFactory } from '@shared/testing/factory/domainobject/board/link-element.do.factory';
import { richTextElementFactory } from '@shared/testing/factory/domainobject/board/rich-text-element.do.factory';
import { submissionContainerElementFactory } from '@shared/testing/factory/domainobject/board/submission-container-element.do.factory';
import { submissionItemFactory } from '@shared/testing/factory/domainobject/board/submission-item.do.factory';
import { setupEntities } from '@shared/testing/setup-entities';
import { BoardNodeRepo } from './board-node.repo';
import { RecursiveSaveVisitor } from './recursive-save.visitor';

describe(RecursiveSaveVisitor.name, () => {
	let visitor: RecursiveSaveVisitor;
	let em: DeepMocked<EntityManager>;
	let boardNodeRepo: DeepMocked<BoardNodeRepo>;

	beforeAll(async () => {
		em = createMock<EntityManager>();
		boardNodeRepo = createMock<BoardNodeRepo>();

		await setupEntities();

		visitor = new RecursiveSaveVisitor(em, boardNodeRepo);
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
			const richTextElement = richTextElementFactory.build();
			jest.spyOn(richTextElement, 'accept');
			const card = cardFactory.build({ children: [richTextElement] });

			card.accept(visitor);

			expect(richTextElement.accept).toHaveBeenCalledWith(visitor);
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
				alternativeText: fileElement.alternativeText,
			};
			expect(visitor.createOrUpdateBoardNode).toHaveBeenCalledWith(expect.objectContaining(expectedNode));
		});
	});

	describe('when visiting a link element composite', () => {
		it('should create or update the node', () => {
			const linkElement = linkElementFactory.build();
			jest.spyOn(visitor, 'createOrUpdateBoardNode');

			visitor.visitLinkElement(linkElement);

			const expectedNode: Partial<LinkElementNode> = {
				id: linkElement.id,
				type: BoardNodeType.LINK_ELEMENT,
				url: linkElement.url,
			};
			expect(visitor.createOrUpdateBoardNode).toHaveBeenCalledWith(expect.objectContaining(expectedNode));
		});
	});

	describe('when visiting a rich text element composite', () => {
		it('should create or update the node', () => {
			const richTextElement = richTextElementFactory.build();
			jest.spyOn(visitor, 'createOrUpdateBoardNode');

			visitor.visitRichTextElement(richTextElement);

			const expectedNode: Partial<RichTextElementNode> = {
				id: richTextElement.id,
				type: BoardNodeType.RICH_TEXT_ELEMENT,
				text: richTextElement.text,
			};
			expect(visitor.createOrUpdateBoardNode).toHaveBeenCalledWith(expect.objectContaining(expectedNode));
		});
	});

	describe('when visiting a submission container element composite', () => {
		it('should create or update the node', () => {
			const submissionContainerElement = submissionContainerElementFactory.build();
			jest.spyOn(visitor, 'createOrUpdateBoardNode');

			visitor.visitSubmissionContainerElement(submissionContainerElement);

			const expectedNode: Partial<SubmissionContainerElementNode> = {
				id: submissionContainerElement.id,
				type: BoardNodeType.SUBMISSION_CONTAINER_ELEMENT,
				dueDate: submissionContainerElement.dueDate,
			};
			expect(visitor.createOrUpdateBoardNode).toHaveBeenCalledWith(expect.objectContaining(expectedNode));
		});
	});

	describe('when visiting a submission item composite', () => {
		it('should create or update the node', () => {
			const submissionItem = submissionItemFactory.build();
			jest.spyOn(visitor, 'createOrUpdateBoardNode');

			visitor.visitSubmissionItem(submissionItem);

			const expectedNode: Partial<SubmissionItemNode> = {
				id: submissionItem.id,
				type: BoardNodeType.SUBMISSION_ITEM,
				completed: submissionItem.completed,
			};
			expect(visitor.createOrUpdateBoardNode).toHaveBeenCalledWith(expect.objectContaining(expectedNode));
		});
	});

	describe('when visiting a external tool element', () => {
		it('should create or update the node', () => {
			const contextExternalTool = contextExternalToolEntityFactory.buildWithId();
			const externalToolElement = externalToolElementFactory.build({
				contextExternalToolId: contextExternalTool.id,
			});
			jest.spyOn(visitor, 'createOrUpdateBoardNode');

			visitor.visitExternalToolElement(externalToolElement);

			const expectedNode: Partial<ExternalToolElementNodeEntity> = {
				id: externalToolElement.id,
				type: BoardNodeType.EXTERNAL_TOOL,
				contextExternalTool,
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
