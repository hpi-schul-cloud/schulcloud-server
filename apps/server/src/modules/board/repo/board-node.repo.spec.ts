import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardNode, CardNode } from '@shared/domain';
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

	describe('findById', () => {
		const setup = async () => {
			const columnBoardNode = columnBoardNodeFactory.buildWithId();
			await em.persistAndFlush(columnBoardNode);
			const columnNodes = columnNodeFactory.buildList(2, { parent: columnBoardNode });
			await em.persistAndFlush(columnNodes);
			const cardNodes = cardNodeFactory.buildList(2, { parent: columnNodes[0] });
			await em.persistAndFlush(cardNodes);
			em.clear();

			return { columnBoardNode, columnNodes, cardNodes };
		};

		it('should return the correct board node for the id', async () => {
			const { cardNodes } = await setup();
			const foundNode = await repo.findById(BoardNode, cardNodes[0].id);

			expect(foundNode.id).toBe(cardNodes[0].id);
			expect(foundNode.path).toBe(cardNodes[0].path);
		});
	});

	describe('findByIds', () => {
		const setup = async () => {
			const columnBoardNode = columnBoardNodeFactory.buildWithId();
			await em.persistAndFlush(columnBoardNode);
			const columnNodes = columnNodeFactory.buildList(2, { parent: columnBoardNode });
			await em.persistAndFlush(columnNodes);
			const cardNodes = cardNodeFactory.buildList(2, { parent: columnNodes[0] });
			await em.persistAndFlush(cardNodes);
			em.clear();

			return { columnBoardNode, columnNodes, cardNodes };
		};

		it('should return the correct board node for the id', async () => {
			const { cardNodes } = await setup();
			const cardNodeIds = cardNodes.map((node) => node.id);
			const foundNodes = await repo.findByIds(BoardNode, cardNodeIds);
			const foundNodeIds = foundNodes.map((node) => node.id);

			expect(foundNodeIds).toContain(cardNodeIds[0]);
			expect(foundNodeIds).toContain(cardNodeIds[1]);
		});
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

	describe('findChildrenOfMany', () => {
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

		it('should find a map of children', async () => {
			const { root, level1, level2 } = await setup();

			const result = await repo.findChildrenOfMany([root, ...level1, ...level2]);

			expect(Object.keys(result)).toEqual([root.pathOfChildren, level1[0].pathOfChildren, level2[1].pathOfChildren]);

			expect(result[root.pathOfChildren]).toHaveLength(2);
			expect(result[level1[0].pathOfChildren]).toHaveLength(2);
			expect(result[level2[1].pathOfChildren]).toHaveLength(2);
		});
	});

	describe('save', () => {
		it('should create new board nodes', async () => {
			const nodes = cardNodeFactory.buildListWithId(3);

			await repo.save(nodes);
			em.clear();

			const result = await em.find(CardNode, {});
			expect(result).toEqual(nodes);
		});

		it('should update existing board nodes', async () => {
			const node = cardNodeFactory.buildWithId({ title: 'before' });
			await em.persistAndFlush(node);
			node.title = 'after';

			await repo.save(node);
			em.clear();

			const result = await em.findOneOrFail(CardNode, node.id);
			expect(result.title).toEqual('after');
		});

		it('should be able to do both - create and update', async () => {
			const node1 = cardNodeFactory.buildWithId({ title: 'before' });
			await em.persistAndFlush(node1);
			em.clear();
			const node2 = cardNodeFactory.buildWithId({ title: 'created' });
			node1.title = 'after';

			await repo.save([node1, node2]);
			em.clear();

			const result = await em.find(CardNode, {});
			expect(result.map((n) => n.title).sort()).toEqual(['after', 'created']);
		});
	});
});
