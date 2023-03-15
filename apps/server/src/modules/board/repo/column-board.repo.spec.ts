import { NotFoundError } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	textElementNodeFactory,
} from '@shared/testing';
import { BoardNodeRepo } from './board-node.repo';
import { ColumnBoardRepo } from './column-board.repo';

describe(ColumnBoardRepo.name, () => {
	let module: TestingModule;
	let repo: ColumnBoardRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [ColumnBoardRepo, BoardNodeRepo],
		}).compile();
		repo = module.get(ColumnBoardRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

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
});
