import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReferenceType } from '@modules/board';
import { BoardNodeEntity } from '@modules/board/repo';
import { columnBoardEntityFactory, columnBoardFactory } from '@modules/board/testing';
import { Test, type TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { cleanupCollections } from '@testing/cleanup-collections';
import { ColumnBoardNodeRepo } from './column-board-node.repo';

describe('ColumnBoardNodeRepo', () => {
	let module: TestingModule;
	let repo: ColumnBoardNodeRepo;
	let em: DeepMocked<EntityManager>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ColumnBoardNodeRepo,
				{
					provide: EntityManager,
					useValue: createMock<EntityManager>(),
				},
			],
		}).compile();

		repo = module.get(ColumnBoardNodeRepo);
		em = module.get(EntityManager);
	});

	describe('persistence', () => {
		let module: TestingModule;
		let repo: ColumnBoardNodeRepo;
		let em: EntityManager;

		beforeAll(async () => {
			module = await Test.createTestingModule({
				imports: [MongoMemoryDatabaseModule.forRoot({ entities: [BoardNodeEntity] })],
				providers: [ColumnBoardNodeRepo],
			}).compile();
			repo = module.get(ColumnBoardNodeRepo);
			em = module.get(EntityManager);
		});

		afterEach(async () => {
			await cleanupCollections(em);
		});

		afterAll(async () => {
			await module.close();
		});

		it('should find only boards with the requested context id and type after reload', async () => {
			const reference = { id: new ObjectId().toHexString(), type: BoardExternalReferenceType.Course };
			const expected = columnBoardEntityFactory.buildList(2, { context: reference });
			const otherId = columnBoardEntityFactory.build();
			const otherType = columnBoardEntityFactory.build({
				context: { ...reference, type: BoardExternalReferenceType.Room },
			});
			await em.persist([...expected, otherId, otherType]).flush();
			em.clear();

			const result = await repo.findByExternalReference(reference);

			expect(result.map(({ id }) => id).sort()).toEqual(expected.map(({ id }) => id).sort());
			result.forEach(({ context }) => {
				expect(context?.id).toBe(reference.id);
				expect(context?.type).toBe(reference.type);
			});
			expect(await repo.findByExternalReference({ ...reference, id: new ObjectId().toHexString() })).toEqual([]);
		});
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('findById', () => {
		const setup = () => {
			const columnBoardNode = columnBoardFactory.build();
			em.findOneOrFail.mockResolvedValueOnce(columnBoardNode);

			return { columnBoardNode };
		};

		it('should find ColumnBoardNode by id', async () => {
			const id = 'someId';
			await repo.findById(id);

			expect(em.findOneOrFail).toHaveBeenCalledWith(BoardNodeEntity, { id });
		});

		it('should return ColumnBoardNode', async () => {
			const id = 'someId';
			const { columnBoardNode } = setup();

			const result = await repo.findById(id);

			expect(result).toBe(columnBoardNode);
		});

		describe('findByExternalReference', () => {
			it('should find board nodes by their external reference', async () => {
				const reference = { id: '507f1f77bcf86cd799439011', type: BoardExternalReferenceType.Course };
				const boardNodes = [columnBoardFactory.build()];
				em.find.mockResolvedValueOnce(boardNodes);

				const result = await repo.findByExternalReference(reference);

				expect(em.find).toHaveBeenCalledWith(BoardNodeEntity, {
					context: { _contextId: reference.id, _contextType: reference.type },
				});
				expect(result).toBe(boardNodes);
			});
		});
	});
});
