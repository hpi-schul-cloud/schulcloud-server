import { MongoMemoryDatabaseModule } from '@infra/database';
import { NotFoundError } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { AnyBoardDo } from '@shared/domain/domainobject';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	richTextElementNodeFactory,
} from '@shared/testing';
import { DrawingDoRepo } from './drawing-do.repo';
import { BoardNodeRepo } from './board-node.repo';

describe(DrawingDoRepo.name, () => {
	let module: TestingModule;
	let repo: DrawingDoRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [DrawingDoRepo, BoardNodeRepo],
		}).compile();
		repo = module.get(DrawingDoRepo);
		em = module.get(EntityManager);
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
});
