import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/mongodb';
import { columnBoardFactory } from '@modules/board/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { ColumnBoardNodeRepo } from './column-board-node.repo';
import { ColumnBoardNode } from './column-board-node.entity';

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

			expect(em.findOneOrFail).toHaveBeenCalledWith(ColumnBoardNode, id);
		});

		it('should return ColumnBoardNode', async () => {
			const id = 'someId';
			const { columnBoardNode } = setup();

			const result = await repo.findById(id);

			expect(result).toBe(columnBoardNode);
		});
	});
});
