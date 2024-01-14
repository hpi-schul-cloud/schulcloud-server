import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { cleanupCollections } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@src/infra/database';
import { ObjectId } from 'bson';
import { Factory } from 'fishery';
import { BoardNodeProps } from './board-node.do';
import { BoardNodeEntity } from './board-node.entity';
import { boardNodeFactory } from './board-node.factory';
import { BoardNodeRepo } from './board-node.repo';

const propsFactory = Factory.define<BoardNodeProps>(({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		path: '',
		level: 0,
		title: `column board #${sequence}`,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});

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

	describe('when persisting', () => {
		it('should work', async () => {
			const boardNode = boardNodeFactory.build();

			repo.persist(boardNode);
			await repo.flush();
		});
	});

	describe('when finding a single node by known id', () => {
		const setup = async () => {
			const props = em.create(BoardNodeEntity, propsFactory.build());
			await em.persistAndFlush(props);
			em.clear();

			return { props };
		};

		it('should find the node', async () => {
			const { props } = await setup();

			const boardNode = await repo.findById(props.id);

			expect(boardNode.id).toBeDefined();
		});
	});

	describe('after persisting a single node', () => {
		const setup = () => {
			const boardNode = boardNodeFactory.build();
			em.clear();

			return { boardNode };
		};

		it('should exist in the database', async () => {
			const { boardNode } = setup();

			await repo.persistAndFlush(boardNode);

			const result = await em.findOneOrFail(BoardNodeEntity, { id: boardNode.id });
			expect(result.id).toEqual(boardNode.id);
		});
	});

	describe('after persisting multiple nodes', () => {
		const setup = () => {
			const boardNodes = boardNodeFactory.buildList(2);
			em.clear();

			return { boardNodes };
		};

		it('should exist in the database', async () => {
			const { boardNodes } = setup();

			await repo.persistAndFlush(boardNodes);

			const result = await em.find(BoardNodeEntity, { id: boardNodes.map((bn) => bn.id) });
			expect(result.length).toEqual(2);
		});
	});

	describe('after a tree was peristed', () => {
		const setup = async () => {
			const parent = boardNodeFactory.build();
			const children = boardNodeFactory.buildList(2);
			children.forEach((child) => parent.addChild(child));
			await repo.persistAndFlush([parent, ...children]);
			em.clear();

			return { parent, children };
		};

		it('can be found using the repo', async () => {
			const { parent, children } = await setup();

			const result = await repo.findById(parent.id);

			expect(result.children.length).toEqual(children.length);
		});
	});
});
