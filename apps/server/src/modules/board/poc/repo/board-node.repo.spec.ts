import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { BaseEntityWithTimestamps, BoardNodeType } from '@shared/domain/entity';
import { cleanupCollections } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@src/infra/database';
import { ObjectId } from 'bson';
import { Factory } from 'fishery';
import { CardProps } from '../domain';
import { BoardNodeEntity } from './entity/board-node.entity';
import { BoardNodeRepo } from './board-node.repo';
import { cardFactory } from '../testing';
// import { Card } from '../domain/card.do';

const propsFactory = Factory.define<CardProps>(({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		path: '',
		level: 0,
		title: `card #${sequence}`,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		type: BoardNodeType.CARD,
		height: 42,
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
			const boardNode = cardFactory.build();

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
	/*
	describe('when finding by class and id', () => {
		describe('when the node is not of the given class', () => {
			const setup = async () => {
				const props = em.create(BoardNodeEntity, propsFactory.build());
				await em.persistAndFlush(props);
				em.clear();

				return { props };
			};

			it('should throw an error', async () => {
				const { props } = await setup();

				await expect(repo.findByClassAndId(Card, props.id)).rejects.toThrowError();
			});
		});
	});
	 */

	describe('when finding multiple nodes by known ids', () => {
		const setup = async () => {
			const props = em.create(BoardNodeEntity, propsFactory.build());

			const child = cardFactory.build();

			const propsWithChildren = em.create(BoardNodeEntity, propsFactory.build());

			// em.find.mockResolvedValueOnce([child]);

			await em.persistAndFlush([props, propsWithChildren]);
			em.clear();
			propsWithChildren.children = [child];

			return { props, propsWithChildren, child };
		};

		it('should find the node', async () => {
			const { props, propsWithChildren } = await setup();

			const boardNodes = await repo.findByIds([props.id, propsWithChildren.id]);

			expect(boardNodes[0].id).toBeDefined();
			expect(boardNodes[1].id).toBeDefined();
		});
	});

	describe('when finding titles by ids', () => {
		const setup = async () => {
			const propWithTitle = em.create(BoardNodeEntity, propsFactory.build());
			const propWithoutTitle = em.create(BoardNodeEntity, propsFactory.build({ title: undefined }));
			await em.persistAndFlush([propWithTitle, propWithoutTitle]);
			em.clear();

			return { propWithTitle, propWithoutTitle };
		};

		it('should find the titles', async () => {
			const { propWithTitle, propWithoutTitle } = await setup();

			const titles = await repo.getTitlesByIds([propWithTitle.id, propWithoutTitle.id]);

			expect(titles[propWithTitle.id]).toEqual(propWithTitle.title);
		});

		it('should return for single id', async () => {
			const { propWithTitle } = await setup();

			const titles = await repo.getTitlesByIds(propWithTitle.id);

			expect(titles[propWithTitle.id]).toEqual(propWithTitle.title);
		});

		it('should return empty string for nodes without title', async () => {
			const { propWithoutTitle } = await setup();

			const titles = await repo.getTitlesByIds(propWithoutTitle.id);

			expect(titles[propWithoutTitle.id]).toEqual('');
		});
	});

	describe('after persisting a single node', () => {
		const setup = () => {
			const boardNode = cardFactory.build();
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
			const boardNodes = cardFactory.buildList(2);
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
			const parent = cardFactory.build();
			const children = cardFactory.buildList(2);
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
