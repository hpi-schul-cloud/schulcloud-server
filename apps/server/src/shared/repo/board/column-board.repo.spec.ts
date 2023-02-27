import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ColumnBoard } from '@shared/domain';
import { cleanupCollections } from '@shared/testing';

import { MongoMemoryDatabaseModule } from '@shared/infra/database';

import { cardSkeletonFactory } from '@shared/testing/factory/board-card-skeleton.factory';
import { columnFactory } from '@shared/testing/factory/board-column.factory';
import { columnBoardFactory } from '@shared/testing/factory/column-board.factory';
import { ColumnBoardRepo } from './column-board.repo';

describe('ColumnBoardRepo', () => {
	let module: TestingModule;
	let repo: ColumnBoardRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [ColumnBoardRepo],
		}).compile();
		repo = module.get(ColumnBoardRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		await em.nativeDelete(ColumnBoardRepo, {});
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(ColumnBoard);
	});

	describe('when there is a board with content', () => {
		const setupBoard = () => {
			const columns = [
				columnFactory.build({ cardSkeletons: cardSkeletonFactory.buildList(3) }),
				columnFactory.build({ cardSkeletons: cardSkeletonFactory.buildList(5) }),
				columnFactory.build({ cardSkeletons: cardSkeletonFactory.buildList(2) }),
			];
			const board = columnBoardFactory.build({ columns });
			return { board };
		};

		it('should persist board', async () => {
			const { board } = setupBoard();
			await repo.save(board);

			em.clear();

			const result = await em.findOneOrFail(ColumnBoard, { id: board.id });
			expect(result.id).toEqual(board.id);
		});

		it('should load columns of the board', async () => {
			const { board } = setupBoard();

			await em.persistAndFlush(board);
			em.clear();

			const result = await repo.findById(board.id);

			expect(result.columns).toHaveLength(board.columns.length);
		});

		it('should load card skeletons of the board columns', async () => {
			const { board } = setupBoard();
			await em.persistAndFlush(board);
			em.clear();

			const result = await repo.findById(board.id);
			expect(result.id).toEqual(board.id);

			expect(result.columns[0].cardSkeletons).toHaveLength(board.columns[0].cardSkeletons.length);
		});
	});
});
