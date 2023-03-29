import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ColumnNode } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections, columnBoardNodeFactory, columnFactory } from '@shared/testing';
import { BoardNodeRepo } from './board-node.repo';
import { ColumnRepo } from './column.repo';

describe(ColumnRepo.name, () => {
	let module: TestingModule;
	let repo: ColumnRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [ColumnRepo, BoardNodeRepo],
		}).compile();
		repo = module.get(ColumnRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

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
