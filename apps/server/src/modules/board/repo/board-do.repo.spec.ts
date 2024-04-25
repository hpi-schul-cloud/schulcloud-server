import { createMock } from '@golevelup/ts-jest';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { CollaborativeTextEditorService } from '@modules/collaborative-text-editor';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { DrawingElementAdapterService } from '@modules/tldraw-client';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { contextExternalToolEntityFactory } from '@modules/tool/context-external-tool/testing';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
	AnyBoardDo,
	BoardExternalReference,
	BoardExternalReferenceType,
	Card,
	Column,
	ColumnBoard,
} from '@shared/domain/domainobject';
import {
	BoardNode,
	CardNode,
	ColumnBoardNode,
	ExternalToolElementNodeEntity,
	RichTextElementNode,
} from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import {
	cardFactory,
	cardNodeFactory,
	cleanupCollections,
	columnBoardFactory,
	columnBoardNodeFactory,
	columnFactory,
	columnNodeFactory,
	contextExternalToolFactory,
	courseFactory,
	externalToolElementNodeFactory,
	fileElementFactory,
	mediaBoardNodeFactory,
	mediaExternalToolElementNodeFactory,
	mediaLineNodeFactory,
	richTextElementFactory,
	richTextElementNodeFactory,
} from '@shared/testing';
import { ContextExternalTool } from '../../tool/context-external-tool/domain';
import { ContextExternalToolEntity } from '../../tool/context-external-tool/entity';
import { BoardDoRepo } from './board-do.repo';
import { BoardNodeRepo } from './board-node.repo';
import { RecursiveDeleteVisitor } from './recursive-delete.vistor';
import { RecursiveSaveVisitor } from './recursive-save.visitor';

describe(BoardDoRepo.name, () => {
	let module: TestingModule;
	let repo: BoardDoRepo;
	let em: EntityManager;
	let recursiveDeleteVisitor: RecursiveDeleteVisitor;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				BoardDoRepo,
				BoardNodeRepo,
				RecursiveDeleteVisitor,
				{ provide: FilesStorageClientAdapterService, useValue: createMock<FilesStorageClientAdapterService>() },
				{ provide: ContextExternalToolService, useValue: createMock<ContextExternalToolService>() },
				{ provide: DrawingElementAdapterService, useValue: createMock<DrawingElementAdapterService>() },
				{ provide: CollaborativeTextEditorService, useValue: createMock<CollaborativeTextEditorService>() },
			],
		}).compile();
		repo = module.get(BoardDoRepo);
		em = module.get(EntityManager);
		recursiveDeleteVisitor = module.get(RecursiveDeleteVisitor);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('findById', () => {
		describe('when finding by id', () => {
			const setup = async () => {
				const boardNode = columnBoardNodeFactory.build();
				await em.persistAndFlush(boardNode);
				em.clear();

				return { boardNode };
			};

			it('should return the object', async () => {
				const { boardNode } = await setup();
				const result = await repo.findById(boardNode.id);
				expect(result.id).toEqual(boardNode.id);
			});

			it('should throw an error when not found', async () => {
				await expect(repo.findById('invalid-id')).rejects.toThrowError(NotFoundError);
			});
		});
	});

	describe('findByClassAndId', () => {
		describe('when finding by class and id', () => {
			const setup = async () => {
				const boardNode = columnBoardNodeFactory.build();
				await em.persistAndFlush(boardNode);

				em.clear();

				return { boardNode };
			};

			it('should return the object', async () => {
				const { boardNode } = await setup();

				const result = await repo.findByClassAndId(ColumnBoard, boardNode.id);

				expect(result.id).toEqual(boardNode.id);
			});

			it('should throw error when id does not belong to the expected class', async () => {
				const { boardNode } = await setup();
				const expectedError = new NotFoundException("There is no 'Column' with this id");

				await expect(repo.findByClassAndId(Column, boardNode.id)).rejects.toThrow(expectedError);
			});
		});
	});

	describe('findByIds', () => {
		describe('when finding by ids', () => {
			const setup = async () => {
				const boardNode = columnBoardNodeFactory.build();
				await em.persistAndFlush(boardNode);
				const columnNodes = columnNodeFactory.buildList(2, { parent: boardNode });
				await em.persistAndFlush(columnNodes);
				const cardNodes = cardNodeFactory.buildList(2, { parent: columnNodes[0] });
				await em.persistAndFlush(cardNodes);
				const elementNodes = richTextElementNodeFactory.buildList(2, { parent: cardNodes[1] });
				await em.persistAndFlush(elementNodes);
				em.clear();

				return { boardNode, columnNodes, cardNodes, elementNodes };
			};

			it('should return the objects', async () => {
				const { boardNode, columnNodes } = await setup();
				const nodeIds = [boardNode.id, columnNodes[0].id];

				const result = await repo.findByIds(nodeIds);
				const resultIds = result.map((obj) => obj.id);

				expect(result[0].children.length).toBeGreaterThan(0);
				expect(result[0].children[0].children.length).toBeGreaterThan(0);

				expect(resultIds).toEqual(nodeIds);
			});

			it('should return nothing for not-existing id', async () => {
				await setup();

				const result = await repo.findByIds(['not-existing id']);

				expect(result).toEqual([]);
			});
		});
	});

	describe('getTitlesByIds', () => {
		const setup = async () => {
			const cardsWithTitles = cardNodeFactory.buildList(3);
			const cardWithoutTitle = cardNodeFactory.build({ title: undefined });

			await em.persistAndFlush([...cardsWithTitles, cardWithoutTitle]);

			return { cardsWithTitles, cardWithoutTitle };
		};

		it('should return titles of node for list of ids', async () => {
			const { cardsWithTitles } = await setup();

			const titleMap = await repo.getTitlesByIds(cardsWithTitles.map((card) => card.id));

			cardsWithTitles.forEach((card) => {
				expect(titleMap[card.id]).toEqual(card.title);
			});
		});

		it('should return node of card for single id', async () => {
			const { cardsWithTitles } = await setup();

			const titleMap = await repo.getTitlesByIds(cardsWithTitles[0].id);

			expect(titleMap[cardsWithTitles[0].id]).toEqual(cardsWithTitles[0].title);
		});

		it('should handle node without title', async () => {
			const { cardWithoutTitle } = await setup();

			const titleMap = await repo.getTitlesByIds(cardWithoutTitle.id);

			expect(titleMap[cardWithoutTitle.id]).toEqual('');
		});

		it('should not return title of node that has not been asked about', async () => {
			const { cardsWithTitles } = await setup();

			const titleMap = await repo.getTitlesByIds(cardsWithTitles[0].id);

			expect(titleMap[cardsWithTitles[1].id]).toEqual(undefined);
		});
	});

	describe('findIdsByExternalReference', () => {
		const setup = async () => {
			const course = courseFactory.build();
			await em.persistAndFlush(course);
			const boardNode = columnBoardNodeFactory.build({
				context: {
					type: BoardExternalReferenceType.Course,
					id: course.id,
				},
			});
			await em.persistAndFlush(boardNode);

			return { boardNode, course };
		};

		it('should find courseboard by course', async () => {
			const { course, boardNode } = await setup();

			const ids = await repo.findIdsByExternalReference({
				type: BoardExternalReferenceType.Course,
				id: course.id,
			});

			expect(ids[0]).toEqual(boardNode.id);
		});
	});

	describe('findParentOfId', () => {
		describe('when fetching a parent', () => {
			const setup = async () => {
				const cardNode = cardNodeFactory.buildWithId();
				const [richTextElement1, richTextElement2] = richTextElementNodeFactory.buildList(3, { parent: cardNode });
				const nonChildRichTextElement = richTextElementNodeFactory.buildWithId();

				await em.persistAndFlush([cardNode, richTextElement1, richTextElement2]);

				return { cardId: cardNode.id, richTextElement1, richTextElement2, nonChildRichTextElement };
			};

			it('should not return the parent for an incorrect childId', async () => {
				const { nonChildRichTextElement } = await setup();

				await expect(repo.findParentOfId(nonChildRichTextElement.id)).rejects.toThrow();
			});

			it('should return the parent for a correct childId', async () => {
				const { cardId, richTextElement1 } = await setup();

				const parent = await repo.findParentOfId(richTextElement1.id);

				expect(parent?.id).toBe(cardId);
			});

			it('should return the parent including all children', async () => {
				const { richTextElement1, richTextElement2 } = await setup();
				const expectedChildIds = [richTextElement1.id, richTextElement2.id];

				const parent = await repo.findParentOfId(richTextElement1.id);
				const actualChildIds = parent?.children?.map((child: AnyBoardDo) => child.id) ?? [];

				expect(parent?.children).toHaveLength(2);
				expect(expectedChildIds).toContain(actualChildIds[0]);
				expect(expectedChildIds).toContain(actualChildIds[1]);
			});

			it('should return undefined if board node has no parent', async () => {
				const { cardId } = await setup();

				const parent = await repo.findParentOfId(cardId);

				expect(parent).toBeUndefined();
			});
		});
	});

	describe('countBoardUsageForExternalTools', () => {
		describe('when counting the amount of boards used by the selected tools', () => {
			const setup = async () => {
				const contextExternalToolId: EntityId = new ObjectId().toHexString();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId(
					undefined,
					contextExternalToolId
				);
				const contextExternalToolEntity: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId(
					undefined,
					contextExternalToolId
				);
				const otherContextExternalToolEntity: ContextExternalToolEntity =
					contextExternalToolEntityFactory.buildWithId();

				const board: ColumnBoardNode = columnBoardNodeFactory.buildWithId();
				const otherBoard: ColumnBoardNode = columnBoardNodeFactory.buildWithId();
				const card: CardNode = cardNodeFactory.buildWithId({ parent: board });
				const otherCard: CardNode = cardNodeFactory.buildWithId({ parent: otherBoard });
				const externalToolElements: ExternalToolElementNodeEntity[] = externalToolElementNodeFactory.buildListWithId(
					2,
					{
						parent: card,
						contextExternalTool: contextExternalToolEntity,
					}
				);
				const otherExternalToolElement: ExternalToolElementNodeEntity = externalToolElementNodeFactory.buildWithId({
					parent: otherCard,
					contextExternalTool: otherContextExternalToolEntity,
				});

				await em.persistAndFlush([
					board,
					otherBoard,
					card,
					otherCard,
					...externalToolElements,
					otherExternalToolElement,
					contextExternalToolEntity,
				]);

				return {
					contextExternalTool,
				};
			};

			it('should return the amount of boards used by the selected tools', async () => {
				const { contextExternalTool } = await setup();

				const result: number = await repo.countBoardUsageForExternalTools([contextExternalTool]);

				expect(result).toEqual(1);
			});
		});
	});

	describe('getAncestorIds', () => {
		describe('when having only a root boardnode', () => {
			const setup = async () => {
				const columnBoardNode = columnBoardNodeFactory.build();

				await em.persistAndFlush([columnBoardNode]);

				return { boardId: columnBoardNode.id };
			};

			it('should return an empty list', async () => {
				const { boardId } = await setup();

				const board = await repo.findById(boardId);
				const ancestorIds = await repo.getAncestorIds(board);

				expect(ancestorIds).toHaveLength(0);
			});
		});

		describe('when having multiple boardnodes', () => {
			const setup = async () => {
				const boardNode = columnBoardNodeFactory.build();
				await em.persistAndFlush(boardNode);
				const columnNodes = columnNodeFactory.buildList(2, { parent: boardNode });
				await em.persistAndFlush(columnNodes);
				const cardNodes = cardNodeFactory.buildList(2, { parent: columnNodes[0] });
				await em.persistAndFlush(cardNodes);
				const elementNodes = richTextElementNodeFactory.buildList(2, { parent: cardNodes[0] });
				await em.persistAndFlush(elementNodes);
				em.clear();

				const boardId = boardNode.id;
				const columnId = columnNodes[0].id;
				const cardId = cardNodes[0].id;
				const secondElementId = elementNodes[1].id;

				return { boardId, columnId, cardId, secondElementId };
			};

			it('should return an empty list', async () => {
				const { boardId, columnId, cardId, secondElementId } = await setup();

				const element = await repo.findById(secondElementId);
				const ancestorIds = await repo.getAncestorIds(element);

				expect(ancestorIds).toEqual([boardId, columnId, cardId]);
			});
		});
	});

	describe('save', () => {
		describe('when called', () => {
			it('should create new board nodes', async () => {
				const cards = cardFactory.buildList(3);

				await repo.save(cards);
				em.clear();

				const result = await em.find(CardNode, {});
				expect(result.map((n) => n.id).sort()).toEqual(cards.map((c) => c.id).sort());
			});

			it('should update existing board nodes', async () => {
				const node = cardNodeFactory.buildWithId({ title: 'before' });
				await em.persistAndFlush(node);

				const card = await repo.findByClassAndId(Card, node.id);
				card.title = 'after';

				await repo.save(card);
				em.clear();

				const result = await em.findOneOrFail(CardNode, node.id);
				expect(result.title).toEqual('after');
			});

			it('should be able to do both - create and update', async () => {
				const node1 = cardNodeFactory.buildWithId({ title: 'before' });
				await em.persistAndFlush(node1);
				em.clear();
				const card1 = await repo.findByClassAndId(Card, node1.id);
				card1.title = 'after';
				const card2 = cardFactory.build({ title: 'created' });

				await repo.save([card1, card2]);
				em.clear();

				const result = await em.find(CardNode, {});
				expect(result.map((n) => n.title).sort()).toEqual(['after', 'created']);
			});

			it('should use the visitor', async () => {
				const board = columnBoardFactory.build();
				jest.spyOn(board, 'accept');

				await repo.save(board);

				expect(board.accept).toHaveBeenCalledWith(expect.any(RecursiveSaveVisitor));
			});

			it('should flush the changes', async () => {
				const board = columnBoardFactory.build();
				jest.spyOn(em, 'flush');

				await repo.save(board);

				expect(em.flush).toHaveBeenCalled();
			});
		});

		describe('when parent is already persisted', () => {
			it('should create child nodes', async () => {
				const column = columnFactory.build();
				await repo.save(column);

				const cards = cardFactory.buildList(2);
				cards.forEach((card) => column.addChild(card));
				await repo.save(cards, column);

				const result = await em.find(CardNode, {});
				expect(result.map((n) => n.parentId)).toEqual([column.id, column.id]);
			});
		});

		describe('when parent is newly built (not yet persisted)', () => {
			it('should throw an error', async () => {
				const card = cardFactory.build();
				const column = columnFactory.build({ children: [card] });

				await expect(repo.save(card, column)).rejects.toThrow();
			});
		});

		describe('when objects have different parents', () => {
			it('should throw an error', async () => {
				const card1 = cardFactory.build();
				const card2 = cardFactory.build();

				const column1 = columnFactory.build({ children: [card1] });
				const column2 = columnFactory.build({ children: [card2] });
				await repo.save([column1, column2]);

				await expect(repo.save([card1, card2], column1)).rejects.toThrow();
			});
		});

		describe('child ordering', () => {
			const setup = async () => {
				const board = columnBoardFactory.build();
				const cards = cardFactory.buildList(3);
				const column = columnFactory.build({ children: cards });

				const columnNode = columnNodeFactory.build({ id: column.id });
				await em.persistAndFlush(columnNode);

				return { board, column, card1: cards[0], card2: cards[1], card3: cards[2] };
			};

			it('should persist child order to positions', async () => {
				const { column, card1, card2, card3 } = await setup();

				await repo.save([card1, card2, card3], column);
				em.clear();

				expect((await em.findOne(CardNode, card1.id))?.position).toEqual(0);
				expect((await em.findOne(CardNode, card2.id))?.position).toEqual(1);
				expect((await em.findOne(CardNode, card3.id))?.position).toEqual(2);
			});
		});
	});

	describe('delete', () => {
		describe('when deleting a domainObject and its descendants', () => {
			const setup = async () => {
				const elements = [...richTextElementFactory.buildList(3), ...fileElementFactory.buildList(2)];
				const card = cardFactory.build({ children: elements });
				await repo.save(card);
				await repo.save(elements, card);
				const siblingCardElements = richTextElementFactory.buildList(3);
				const siblingCard = cardFactory.build({ children: siblingCardElements });
				await repo.save(siblingCard);
				await repo.save(siblingCardElements, siblingCard);
				const column = columnFactory.build({ children: [card, siblingCard] });
				await repo.save(column);
				em.clear();

				return { card, elements, siblingCard, siblingCardElements };
			};

			it('should delete a domain object', async () => {
				const { elements } = await setup();

				await repo.delete(elements[0]);
				em.clear();

				await expect(em.findOneOrFail(RichTextElementNode, elements[0].id)).rejects.toThrow();
			});

			it('should delete all descendants', async () => {
				const { card, elements } = await setup();

				await repo.delete(card);
				em.clear();

				await expect(em.findOneOrFail(RichTextElementNode, elements[0].id)).rejects.toThrow();
				await expect(em.findOneOrFail(RichTextElementNode, elements[1].id)).rejects.toThrow();
				await expect(em.findOneOrFail(RichTextElementNode, elements[2].id)).rejects.toThrow();
				await expect(em.findOneOrFail(RichTextElementNode, elements[3].id)).rejects.toThrow();
				await expect(em.findOneOrFail(RichTextElementNode, elements[4].id)).rejects.toThrow();
			});

			it('should not delete descendants of siblings', async () => {
				const { card, siblingCardElements } = await setup();

				await repo.delete(card);
				em.clear();

				await expect(em.findOneOrFail(RichTextElementNode, siblingCardElements[0].id)).resolves.toBeDefined();
				await expect(em.findOneOrFail(RichTextElementNode, siblingCardElements[1].id)).resolves.toBeDefined();
				await expect(em.findOneOrFail(RichTextElementNode, siblingCardElements[2].id)).resolves.toBeDefined();
			});

			it('should use the visitor', async () => {
				const { card } = await setup();
				card.acceptAsync = jest.fn();

				await repo.delete(card);

				expect(card.acceptAsync).toHaveBeenCalledWith(recursiveDeleteVisitor);
			});

			it('should use the visitor', async () => {
				const { card } = await setup();
				card.acceptAsync = jest.fn();

				await repo.delete(card);

				expect(card.acceptAsync).toHaveBeenCalledWith(recursiveDeleteVisitor);
			});
		});
	});

	describe('deleteByExternalReference', () => {
		describe('when deleting a board by its external reference', () => {
			const setup = async () => {
				const courseContext: BoardExternalReference = {
					id: new ObjectId().toHexString(),
					type: BoardExternalReferenceType.Course,
				};
				const courseBoard = columnBoardNodeFactory.buildWithId({ context: courseContext });
				const courseColumn = columnNodeFactory.buildWithId({ parent: courseBoard });
				const courseCard = cardNodeFactory.buildWithId({ parent: courseColumn });
				const courseElement = richTextElementNodeFactory.buildWithId({ parent: courseCard });

				const userContext: BoardExternalReference = {
					id: new ObjectId().toHexString(),
					type: BoardExternalReferenceType.User,
				};
				const userMediaBoard = mediaBoardNodeFactory.buildWithId({ context: userContext });
				const userMediaLine = mediaLineNodeFactory.buildWithId({ parent: userMediaBoard });
				const userMediaElement = mediaExternalToolElementNodeFactory.buildWithId({ parent: userMediaLine });

				await em.persistAndFlush([
					courseBoard,
					courseColumn,
					courseCard,
					courseElement,
					userMediaBoard,
					userMediaLine,
					userMediaElement,
				]);
				em.clear();

				return {
					courseContext,
					courseBoard,
					courseColumn,
					courseCard,
					courseElement,
					userMediaBoard,
					userMediaLine,
					userMediaElement,
				};
			};

			it('should delete a board with the given reference', async () => {
				const { courseContext, courseBoard, courseColumn, courseCard, courseElement } = await setup();

				await repo.deleteByExternalReference(courseContext);
				em.clear();

				await expect(
					em.find(BoardNode, { id: { $in: [courseBoard.id, courseColumn.id, courseCard.id, courseElement.id] } })
				).resolves.toHaveLength(0);
			});

			it('should not delete a board without the given reference', async () => {
				const { courseContext, userMediaBoard, userMediaLine, userMediaElement } = await setup();

				await repo.deleteByExternalReference(courseContext);
				em.clear();

				await expect(
					em.find(BoardNode, { id: { $in: [userMediaBoard.id, userMediaLine.id, userMediaElement.id] } })
				).resolves.toHaveLength(3);
			});
		});
	});
});
