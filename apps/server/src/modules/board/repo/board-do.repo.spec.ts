import { createMock } from '@golevelup/ts-jest';
import { NotFoundError } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AnyBoardDo, Card, CardNode, Column, ColumnBoard, TextElementNode } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import {
	cardFactory,
	cardNodeFactory,
	cleanupCollections,
	columnBoardFactory,
	columnBoardNodeFactory,
	columnFactory,
	columnNodeFactory,
	fileElementFactory,
	textElementFactory,
	textElementNodeFactory,
} from '@shared/testing';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
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
				const elementNodes = textElementNodeFactory.buildList(2, { parent: cardNodes[1] });
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

	describe('findParentOfId', () => {
		describe('when fetching a parent', () => {
			const setup = async () => {
				const cardNode = cardNodeFactory.buildWithId();
				const [textElement1, textElement2] = textElementNodeFactory.buildList(3, { parent: cardNode });
				const nonChildTextElement = textElementNodeFactory.buildWithId();

				await em.persistAndFlush([cardNode, textElement1, textElement2]);

				return { cardId: cardNode.id, textElement1, textElement2, nonChildTextElement };
			};

			it('should not return the parent for an incorrect childId', async () => {
				const { nonChildTextElement } = await setup();

				await expect(repo.findParentOfId(nonChildTextElement.id)).rejects.toThrow();
			});

			it('should return the parent for a correct childId', async () => {
				const { cardId, textElement1 } = await setup();

				const parent = await repo.findParentOfId(textElement1.id);

				expect(parent?.id).toBe(cardId);
			});

			it('should return the parent including all children', async () => {
				const { textElement1, textElement2 } = await setup();
				const expectedChildIds = [textElement1.id, textElement2.id];

				const parent = await repo.findParentOfId(textElement1.id);
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
				const elementNodes = textElementNodeFactory.buildList(2, { parent: cardNodes[0] });
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
				const elements = [...textElementFactory.buildList(3), ...fileElementFactory.buildList(2)];
				const card = cardFactory.build({ children: elements });
				await repo.save(card);
				await repo.save(elements, card);
				const siblingCardElements = textElementFactory.buildList(3);
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

				await expect(em.findOneOrFail(TextElementNode, elements[0].id)).rejects.toThrow();
			});

			it('should delete all descendants', async () => {
				const { card, elements } = await setup();

				await repo.delete(card);
				em.clear();

				await expect(em.findOneOrFail(TextElementNode, elements[0].id)).rejects.toThrow();
				await expect(em.findOneOrFail(TextElementNode, elements[1].id)).rejects.toThrow();
				await expect(em.findOneOrFail(TextElementNode, elements[2].id)).rejects.toThrow();
				await expect(em.findOneOrFail(TextElementNode, elements[3].id)).rejects.toThrow();
				await expect(em.findOneOrFail(TextElementNode, elements[4].id)).rejects.toThrow();
			});

			it('should not delete descendants of siblings', async () => {
				const { card, siblingCardElements } = await setup();

				await repo.delete(card);
				em.clear();

				await expect(em.findOneOrFail(TextElementNode, siblingCardElements[0].id)).resolves.toBeDefined();
				await expect(em.findOneOrFail(TextElementNode, siblingCardElements[1].id)).resolves.toBeDefined();
				await expect(em.findOneOrFail(TextElementNode, siblingCardElements[2].id)).resolves.toBeDefined();
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
});
