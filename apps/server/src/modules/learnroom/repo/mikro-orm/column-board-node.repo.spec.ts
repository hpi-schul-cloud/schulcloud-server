import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/mongodb';
import { BoardExternalReferenceType } from '@modules/board';
import { BoardNodeEntity } from '@modules/board/repo';
import { columnBoardFactory } from '@modules/board/testing';
import { Test, type TestingModule } from '@nestjs/testing';
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
