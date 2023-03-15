import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { columnBoardFactory } from '@shared/testing/factory/domainobject';
import { Logger } from '@src/core/logger';
import { ColumnBoardRepo, ColumnRepo } from '../repo';
import { ColumnBoardService } from './column-board.service';

describe(ColumnBoardService.name, () => {
	let module: TestingModule;
	let service: ColumnBoardService;
	let columnBoardRepo: DeepMocked<ColumnBoardRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ColumnBoardService,
				{
					provide: ColumnBoardRepo,
					useValue: createMock<ColumnBoardRepo>(),
				},
				{
					provide: ColumnRepo,
					useValue: createMock<ColumnRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(ColumnBoardService);
		columnBoardRepo = module.get(ColumnBoardRepo);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('finding a board', () => {
		const setup = () => {
			const board = columnBoardFactory.build();
			const boardId = board.id;

			return { board, boardId };
		};

		it('should call the card repository', async () => {
			const { boardId } = setup();

			await service.findById(boardId);

			expect(columnBoardRepo.findById).toHaveBeenCalledWith(boardId);
		});

		it('should return the columnBoard object of the given', async () => {
			const { board } = setup();
			columnBoardRepo.findById.mockResolvedValueOnce(board);

			const result = await service.findById(board.id);
			expect(result).toEqual(board);
		});

		it('should throw not found exception if board does not exist', async () => {
			const error = new Error('not found');
			columnBoardRepo.findById.mockRejectedValueOnce(error);

			const notExistingBoardId = new ObjectId().toHexString();

			await expect(async () => service.findById(notExistingBoardId)).rejects.toThrow(error);
		});
	});
});
