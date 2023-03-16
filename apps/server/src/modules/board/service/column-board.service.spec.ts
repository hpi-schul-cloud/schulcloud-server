import { createMock, DeepMocked } from '@golevelup/ts-jest';
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
	let columnRepo: DeepMocked<ColumnRepo>;

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
		columnRepo = module.get(ColumnRepo);
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
	});

	describe('creating a board', () => {
		it('should save a board using the repo', async () => {
			await service.createBoard();

			expect(columnBoardRepo.save).toHaveBeenCalledWith(
				expect.objectContaining({
					id: expect.any(String),
					title: '',
					columns: [],
					createdAt: expect.any(Date),
					updatedAt: expect.any(Date),
				})
			);
		});
	});

	describe('creating a column', () => {
		const setup = () => {
			const board = columnBoardFactory.build();
			const boardId = board.id;

			return { board, boardId };
		};

		it('should save a list of columns using the repo', async () => {
			const { board, boardId } = setup();

			columnBoardRepo.findById.mockResolvedValueOnce(board);

			await service.createColumn(boardId);

			expect(columnRepo.save).toHaveBeenCalledWith(
				[
					expect.objectContaining({
						id: expect.any(String),
						title: '',
						cards: [],
						createdAt: expect.any(Date),
						updatedAt: expect.any(Date),
					}),
				],
				boardId
			);
		});
	});
});
