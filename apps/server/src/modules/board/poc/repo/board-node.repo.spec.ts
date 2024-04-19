import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { cleanupCollections } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@src/infra/database';
import { BoardNodeEntity } from './entity/board-node.entity';
import { BoardNodeRepo } from './board-node.repo';
import { cardFactory, columnBoardFactory, columnFactory } from '../testing';

describe('BoardNodeRepo', () => {
	let module: TestingModule;
	let repo: BoardNodeRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [BaseEntityWithTimestamps, BoardNodeEntity] })],
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

	describe('persist (and flush)', () => {
		const setup = () => {
			const board = columnBoardFactory.build({
				children: columnFactory.buildList(2, { children: cardFactory.buildList(2) }),
			});

			return { board };
		};

		it('should be able to persist a tree of nodes', async () => {
			const { board } = setup();

			repo.persist(board);
			await repo.flush();
			em.clear();

			const nodeCount = await em.count(BoardNodeEntity);
			expect(nodeCount).toBe(5);
		});

		it('should be able to persist more multiple root nodes', async () => {
			const { board: board1 } = setup();
			const { board: board2 } = setup();

			repo.persist([board1, board2]);
			await repo.flush();
			em.clear();

			const nodeCount = await em.count(BoardNodeEntity);
			expect(nodeCount).toBe(10);
		});
	});

	describe('findById', () => {
		const setup = async () => {
			const card = cardFactory.build();

			const column = columnFactory.build({ children: [card] });

			const board = columnBoardFactory.build({
				children: [column],
			});

			await repo.persistAndFlush(board);
			em.clear();

			return { board, column, card };
		};

		it('should be able to find a node tree by root id', async () => {
			const { board, column, card } = await setup();

			const result = await repo.findById(board.id);

			// TODO tree matcher (by id)?
			expect(result.id).toEqual(board.id);
			expect(result.children[0].id).toEqual(column.id);
			expect(result.children[0].children[0].id).toEqual(card.id);
		});
	});

	describe('findByIds', () => {
		it.todo('should be able to find a node tree by root id');
		it.todo('should use depth...');
	});

	// ---- BEGIN OLD CODE - remove when not needed anymore
	// describe('when persisting', () => {
	// 	it('should work', async () => {
	// 		const boardNode = cardFactory.build();

	// 		repo.persist(boardNode);
	// 		await repo.flush();
	// 	});
	// });

	// describe('when finding a single node by known id', () => {
	// 	const setup = async () => {
	// 		const props = em.create(BoardNodeEntity, propsFactory.build());
	// 		await em.persistAndFlush(props);
	// 		em.clear();

	// 		return { props };
	// 	};

	// 	it('should find the node', async () => {
	// 		const { props } = await setup();

	// 		const boardNode = await repo.findById(props.id);

	// 		expect(boardNode.id).toBeDefined();
	// 	});
	// });

	// describe('after persisting a single node', () => {
	// 	const setup = () => {
	// 		const boardNode = cardFactory.build();
	// 		em.clear();

	// 		return { boardNode };
	// 	};

	// 	it('should exist in the database', async () => {
	// 		const { boardNode } = setup();

	// 		await repo.persistAndFlush(boardNode);

	// 		const result = await em.findOneOrFail(BoardNodeEntity, { id: boardNode.id });
	// 		expect(result.id).toEqual(boardNode.id);
	// 	});
	// });

	// describe('after persisting multiple nodes', () => {
	// 	const setup = () => {
	// 		const boardNodes = cardFactory.buildList(2);
	// 		em.clear();

	// 		return { boardNodes };
	// 	};

	// 	it('should exist in the database', async () => {
	// 		const { boardNodes } = setup();

	// 		await repo.persistAndFlush(boardNodes);

	// 		const result = await em.find(BoardNodeEntity, { id: boardNodes.map((bn) => bn.id) });
	// 		expect(result.length).toEqual(2);
	// 	});
	// });

	// describe('after a tree was peristed', () => {
	// 	const setup = async () => {
	// 		const parent = columnFactory.build();
	// 		const children = cardFactory.buildList(2);
	// 		children.forEach((child) => parent.addChild(child));
	// 		await repo.persistAndFlush([parent, ...children]);
	// 		em.clear();

	// 		return { parent, children };
	// 	};

	// 	it('can be found using the repo', async () => {
	// 		const { parent, children } = await setup();

	// 		const result = await repo.findById(parent.id);

	// 		expect(result.children.length).toEqual(children.length);
	// 	});
	// });
	// ---- END OLD CODE
});
