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

describe('BoardNodeRepo', () => {
	let module: TestingModule;
	let repo: BoardNodeRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [BoardNodeRepo],
		}).compile();
		repo = module.get(BoardNodeRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	const setup = async () => {
		const root = columnBoardNodeFactory.build();
		await em.persistAndFlush(root);
		const level1 = columnNodeFactory.buildList(2, { parent: root });
		await em.persistAndFlush(level1);
		const level2 = cardNodeFactory.buildList(2, { parent: level1[0] });
		await em.persistAndFlush(level2);
		const level3 = textElementNodeFactory.buildList(2, { parent: level2[1] });
		await em.persistAndFlush(level3);
		em.clear();

		return { root, level1, level2, level3 };
	};

	describe('findDescendants', () => {
		describe('when starting at the root node', () => {
			it('should find descendents with a specific depth', async () => {
				const { root, level1, level2 } = await setup();

				const result = await repo.findDescendants(root, 2);

				const resultIds = result.map((o) => o.id).sort();
				const expectedIds = [...level1, ...level2].map((o) => o.id).sort();
				expect(resultIds).toEqual(expectedIds);
			});
		});

		describe('when starting at a nested node', () => {
			it('should find descendents with a specific depth', async () => {
				const { level1, level2 } = await setup();

				const result = await repo.findDescendants(level1[0], 1);

				const resultIds = result.map((o) => o.id).sort();
				const expectedIds = [...level2].map((o) => o.id).sort();
				expect(resultIds).toEqual(expectedIds);
			});
		});

		describe('when depth is undefined', () => {
			it('should return all descendants', async () => {
				const { level1, level2, level3 } = await setup();

				const result = await repo.findDescendants(level1[0]);

				const resultIds = result.map((o) => o.id).sort();
				const expectedIds = [...level2, ...level3].map((o) => o.id).sort();
				expect(resultIds).toEqual(expectedIds);
			});
		});

		describe('when depth is 0', () => {
			it('should return empty list', async () => {
				const { level1 } = await setup();

				const result = await repo.findDescendants(level1[0], 0);

				expect(result).toEqual([]);
			});
		});
	});
});
