import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ColumnBoard } from '@shared/domain';
import { setupEntities } from '@shared/testing';
import { columnBoardFactory, columnFactory } from '@shared/testing/factory/domainobject';
import { BoardDoRepo, BoardNodeRepo } from '../repo';
import { ColumnBoardService } from './column-board.service';

describe(ColumnBoardService.name, () => {
	let module: TestingModule;
	let service: ColumnBoardService;
	let boardDoRepo: DeepMocked<BoardDoRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ColumnBoardService,
				{
					provide: BoardDoRepo,
					useValue: createMock<BoardDoRepo>(),
				},
				{
					provide: BoardNodeRepo,
					useValue: createMock<BoardNodeRepo>(),
				},
			],
		}).compile();

		service = module.get(ColumnBoardService);
		boardDoRepo = module.get(BoardDoRepo);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	const setup = () => {
		const board = columnBoardFactory.build();
		const boardId = board.id;
		const column = columnFactory.build();

		return { board, boardId, column };
	};

	describe('finding a board', () => {
		it('should call the board do repository', async () => {
			const { boardId, board } = setup();
			boardDoRepo.findByClassAndId.mockResolvedValueOnce(board);

			await service.findById(boardId);

			expect(boardDoRepo.findByClassAndId).toHaveBeenCalledWith(ColumnBoard, boardId);
		});

		it('should return the columnBoard object of the given', async () => {
			const { board } = setup();
			boardDoRepo.findByClassAndId.mockResolvedValueOnce(board);

			const result = await service.findById(board.id);

			expect(result).toEqual(board);
		});
	});

	describe('creating a board', () => {
		it('should save a board using the repo', async () => {
			await service.create();

			expect(boardDoRepo.save).toHaveBeenCalledWith(
				expect.objectContaining({
					id: expect.any(String),
					title: '',
					children: [],
					createdAt: expect.any(Date),
					updatedAt: expect.any(Date),
				})
			);
		});
	});

	describe('deleting a board', () => {
		it('should call the service to delete the board', async () => {
			const { board } = setup();

			await service.delete(board.id);

			expect(boardDoRepo.deleteById).toHaveBeenCalledWith(board.id);
		});
	});
});
