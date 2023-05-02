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

	describe('findDescendants', () => {
		const setup = async () => {
			// root
			// -- level1[0]
			// ---- level2[0]
			// ---- level2[1]
			// ------ level3[0]
			// ------ level3[1]
			// -- level1[1]

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

	describe('findDescendantsOfMany', () => {
		describe('when giving ids from boardNodes of different levels', () => {
			const setup = async () => {
				// root
				// -- level1[0]
				// ---- level2[0]
				// ---- level2[1]
				// ------ level3[0]
				// ------ level3[1]
				// -- level1[1]

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

			it('should find a map of children that is complete', async () => {
				const { root, level1, level2 } = await setup();

				const result = await repo.findDescendantsOfMany([root, ...level1, ...level2]);

				expect(Object.keys(result)).toEqual([root.pathOfChildren, level1[0].pathOfChildren, level2[1].pathOfChildren]);

				expect(result[root.pathOfChildren]).toHaveLength(6);
				expect(result[level1[0].pathOfChildren]).toHaveLength(4);
				expect(result[level2[1].pathOfChildren]).toHaveLength(2);
			});
		});

		describe('when giving ids of some boardNodes', () => {
			const setup = async () => {
				const root = columnBoardNodeFactory.build();
				await em.persistAndFlush(root);
				const [column0, column1, column2] = columnNodeFactory.buildList(3, { parent: root });
				await em.persistAndFlush([column0, column1, column2]);
				const [card00, card01] = cardNodeFactory.buildList(2, { parent: column0 });
				await em.persistAndFlush([card00, card01]);
				const [text000, text001] = textElementNodeFactory.buildList(2, { parent: card00 });
				await em.persistAndFlush([text000, text001]);
				const [card20, card21] = cardNodeFactory.buildList(2, { parent: column2 });
				await em.persistAndFlush([card20, card21]);
				const [text210, text211] = textElementNodeFactory.buildList(2, { parent: card21 });
				await em.persistAndFlush([text210, text211]);
				em.clear();

				return { root, column0, card00, card01, text000, text001, column1, column2, card20, card21, text210, text211 };
			};

			it('should return all decendants of those part trees', async () => {
				// root
				// -- column0     <-- requested
				// ---- card00    <-- returned
				// ------ text000 <-- returned
				// ------ text001 <-- returned
				// ---- card01    <-- returned
				// -- column1
				// -- column2
				// ---- card20
				// ---- card21    <-- requested
				// ------ text210 <-- returned
				// ------ text211 <-- returned
				const { column0, card00, card01, text000, text001, card21, text210, text211 } = await setup();

				const result = await repo.findDescendantsOfMany([column0, card21]);
				const returnedColumnDescendantIds = result[column0.pathOfChildren].map((o) => o.id);
				const returnedCardDescendantIds = result[card21.pathOfChildren].map((o) => o.id);

				expect(returnedCardDescendantIds).toEqual([text210.id, text211.id]);
				expect(returnedColumnDescendantIds).toEqual([card00.id, card01.id, text000.id, text001.id]);
			});

			it('should return no decendants of leaf nodes', async () => {
				// root
				// -- column0
				// ---- card00
				// ------ text000
				// ------ text001
				// ---- card01
				// -- column1     <-- requested
				// -- column2
				// ---- card20    <-- requested
				// ---- card21
				// ------ text210
				// ------ text211
				const { column1, card20 } = await setup();

				const result = await repo.findDescendantsOfMany([column1, card20]);
				const returnedDescendants = Object.values(result).flat();

				expect(returnedDescendants).toHaveLength(0);
			});
		});
	});
});
