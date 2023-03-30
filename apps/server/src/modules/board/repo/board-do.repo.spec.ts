import { NotFoundError } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AnyBoardDo, BoardNode, CardNode, Column, ColumnBoard, ColumnNode, TextElementNode } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import {
	cardFactory,
	cardNodeFactory,
	cleanupCollections,
	columnBoardFactory,
	columnBoardNodeFactory,
	columnFactory,
	columnNodeFactory,
	textElementFactory,
	textElementNodeFactory,
} from '@shared/testing';
import { BoardDoRepo } from './board-do.repo';
import { BoardNodeRepo } from './board-node.repo';

describe(BoardDoRepo.name, () => {
	let module: TestingModule;
	let repo: BoardDoRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [BoardDoRepo, BoardNodeRepo],
		}).compile();
		repo = module.get(BoardDoRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('column board', () => {
		describe('findById', () => {
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

			it('should find the board', async () => {
				const { boardNode } = await setup();
				const result = await repo.findById(boardNode.id);
				expect(result.id).toEqual(boardNode.id);
			});

			it('should throw an error when not found', async () => {
				await expect(repo.findById('invalid-id')).rejects.toThrowError(NotFoundError);
			});
		});

		describe('save', () => {
			const setup = () => {
				const board = columnBoardFactory.build();

				return { board };
			};

			it('should save the board', async () => {
				const { board } = setup();

				await repo.save(board);
				em.clear();

				const result = await em.findOneOrFail(BoardNode, board.id);

				expect(result.id).toEqual(board.id);
			});
		});
	});

	describe('column', () => {
		describe('save', () => {
			const setup = async () => {
				const column = columnFactory.build();

				const boardNode = columnBoardNodeFactory.build();
				await em.persistAndFlush(boardNode);

				return { boardId: boardNode.id, column };
			};

			it('should save column', async () => {
				const { boardId, column } = await setup();

				await repo.save(column, boardId);
				em.clear();

				const result = await em.findOneOrFail(ColumnNode, column.id);

				expect(result.id).toEqual(column.id);
			});
		});
	});

	describe('card', () => {
		describe('findById', () => {
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

			it('should find the card', async () => {
				const { cardNodes } = await setup();
				const result = await repo.findById(cardNodes[0].id);
				expect(result.id).toEqual(cardNodes[0].id);
			});

			it('should throw an error when not found', async () => {
				await expect(repo.findById('invalid-id')).rejects.toThrowError(NotFoundError);
			});
		});

		describe('save', () => {
			const setup = async () => {
				const cards = cardFactory.buildList(3);

				const columnNode = columnNodeFactory.build();
				await em.persistAndFlush(columnNode);

				return { columnId: columnNode.id, card1: cards[0], card2: cards[1], card3: cards[2] };
			};

			it('should save cards', async () => {
				const { columnId, card1 } = await setup();

				await repo.save(card1, columnId);
				em.clear();

				const result = await em.findOneOrFail(CardNode, card1.id);

				expect(result.id).toEqual(card1.id);
			});

			it('should persist card order to positions', async () => {
				const { columnId, card1, card2, card3 } = await setup();

				await repo.save([card1, card2, card3], columnId);
				em.clear();

				expect((await em.findOne(CardNode, card1.id))?.position).toEqual(0);
				expect((await em.findOne(CardNode, card2.id))?.position).toEqual(1);
				expect((await em.findOne(CardNode, card3.id))?.position).toEqual(2);
			});
		});
	});

	describe('text element', () => {
		describe('save', () => {
			const setup = async () => {
				const [textElement1, textElement2, textElement3] = textElementFactory.buildList(3);

				const cardNode = cardNodeFactory.build();
				await em.persistAndFlush(cardNode);

				return { cardId: cardNode.id, textElement1, textElement2, textElement3 };
			};

			it('should save content elements', async () => {
				const { cardId, textElement1 } = await setup();

				await repo.save(textElement1, cardId);
				em.clear();

				const result = await em.findOne(TextElementNode, textElement1.id);

				expect(result).toBeDefined();
			});

			it('should persist card order to positions', async () => {
				const { cardId, textElement1, textElement2, textElement3 } = await setup();

				await repo.save([textElement1, textElement2, textElement3], cardId);
				em.clear();

				expect((await em.findOne(TextElementNode, textElement1.id))?.position).toEqual(0);
				expect((await em.findOne(TextElementNode, textElement2.id))?.position).toEqual(1);
				expect((await em.findOne(TextElementNode, textElement3.id))?.position).toEqual(2);
			});
		});
	});

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

	describe('when deleting a domainObject and its descendants', () => {
		const setup = async () => {
			const cardNode = cardNodeFactory.buildWithId();
			const textElementNodes = textElementNodeFactory.buildListWithId(3, { parent: cardNode });
			const independentTextElementNode = textElementNodeFactory.buildWithId();
			await em.persistAndFlush([cardNode, ...textElementNodes, independentTextElementNode]);

			const card = await repo.findById(cardNode.id);

			return { card, cardNode, textElementNodes, independentTextElementNode };
		};

		it('should delete an element', async () => {
			const { textElementNodes } = await setup();

			await repo.deleteById(textElementNodes[0].id);
			em.clear();

			await expect(em.findOneOrFail(TextElementNode, textElementNodes[0].id)).rejects.toThrow();
		});
	});

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
