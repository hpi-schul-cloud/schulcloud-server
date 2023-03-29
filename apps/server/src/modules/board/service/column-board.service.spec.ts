import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { columnBoardFactory, columnFactory } from '@shared/testing/factory/domainobject';
import { Logger } from '@src/core/logger';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';
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
					provide: Logger,
					useValue: createMock<Logger>(),
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

	describe('finding a board', () => {
		const setup = () => {
			const board = columnBoardFactory.build();
			const boardId = board.id;
			const column = columnFactory.build();

			return { board, boardId, column };
		};

		it('should call the board do repository', async () => {
			const { boardId, board } = setup();
			boardDoRepo.findById.mockResolvedValueOnce(board);

			await service.findById(boardId);

			expect(boardDoRepo.findById).toHaveBeenCalledWith(boardId, 2);
		});

		it('should return the columnBoard object of the given', async () => {
			const { board } = setup();
			boardDoRepo.findById.mockResolvedValueOnce(board);

			const result = await service.findById(board.id);

			expect(result).toEqual(board);
		});

		it('should throw error when id does not belong to a columnboard', async () => {
			const { column } = setup();

			const expectedError = new NotFoundException(`There is no columboard with this id`);

			boardDoRepo.findById.mockResolvedValue(column);

			await expect(service.findById(column.id)).rejects.toThrowError(expectedError);
		});
	});

	describe('creating a board', () => {
		it('should save a board using the repo', async () => {
			await service.createBoard();

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

	describe('creating a column', () => {
		const setup = () => {
			const board = columnBoardFactory.build();
			const boardId = board.id;

			return { board, boardId };
		};

		it('should save a list of columns using the repo', async () => {
			const { board, boardId } = setup();

			boardDoRepo.findById.mockResolvedValueOnce(board);

			await service.createColumn(boardId);

			expect(boardDoRepo.save).toHaveBeenCalledWith(
				[
					expect.objectContaining({
						id: expect.any(String),
						title: '',
						children: [],
						createdAt: expect.any(Date),
						updatedAt: expect.any(Date),
					}),
				],
				boardId
			);
		});
	});

	describe('creating a card', () => {
		const setup = () => {
			const column = columnFactory.build();
			const board = columnBoardFactory.build({ children: [column] });
			const boardId = board.id;
			const columnId = column.id;

			return { board, boardId, column, columnId };
		};

		it('should save a list of cards using the repo', async () => {
			const { board, boardId, columnId } = setup();

			boardDoRepo.findById.mockResolvedValueOnce(board);

			await service.createCard(boardId, columnId);

			expect(boardDoRepo.save).toHaveBeenCalledWith(
				[
					expect.objectContaining({
						id: expect.any(String),
						title: '',
						height: 150,
						children: [],
						createdAt: expect.any(Date),
						updatedAt: expect.any(Date),
					}),
				],
				columnId
			);
		});

		it('should throw not found exception if requested column id has not been found', async () => {
			const { board, boardId } = setup();

			const notExistingColumnId = new ObjectId().toHexString();
			const error = new NotFoundException(`child is not child of this parent`);

			boardDoRepo.findById.mockResolvedValueOnce(board);

			await expect(service.createCard(boardId, notExistingColumnId)).rejects.toThrowError(error);
		});
	});
});
