import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Column } from '@shared/domain';
import { setupEntities } from '@shared/testing';
import { columnBoardFactory, columnFactory } from '@shared/testing/factory/domainobject';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';
import { ColumnService } from './column.service';

describe(ColumnService.name, () => {
	let module: TestingModule;
	let service: ColumnService;
	let boardDoRepo: DeepMocked<BoardDoRepo>;
	let boardDoService: DeepMocked<BoardDoService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ColumnService,
				{
					provide: BoardDoRepo,
					useValue: createMock<BoardDoRepo>(),
				},
				{
					provide: BoardDoService,
					useValue: createMock<BoardDoService>(),
				},
			],
		}).compile();

		service = module.get(ColumnService);
		boardDoRepo = module.get(BoardDoRepo);
		boardDoService = module.get(BoardDoService);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findById', () => {
		describe('when finding a column', () => {
			const setup = () => {
				const column = columnFactory.buildWithId();
				return { column, columnId: column.id };
			};

			it('should call the repository', async () => {
				const { column, columnId } = setup();
				boardDoRepo.findByClassAndId.mockResolvedValueOnce(column);

				await service.findById(columnId);

				expect(boardDoRepo.findByClassAndId).toHaveBeenCalledWith(Column, columnId);
			});

			it('should return the column', async () => {
				const { column, columnId } = setup();
				boardDoRepo.findByClassAndId.mockResolvedValueOnce(column);

				const result = await service.findById(columnId);

				expect(result).toEqual(column);
			});
		});
	});

	describe('create', () => {
		describe('when creating a column', () => {
			const setup = () => {
				const board = columnBoardFactory.build();
				const boardId = board.id;

				return { board, boardId };
			};

			it('should save a list of columns using the repo', async () => {
				const { board, boardId } = setup();

				await service.create(board);

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
	});

	describe('delete', () => {
		describe('when deleting a column', () => {
			it('should call the service', async () => {
				const column = columnFactory.build();

				await service.delete(column);

				expect(boardDoService.deleteWithDescendants).toHaveBeenCalledWith(column);
			});
		});
	});

	describe('move', () => {
		describe('when moving a column', () => {
			it('should call the service', async () => {
				const board = columnBoardFactory.build();
				const column = columnFactory.build();

				await service.move(column, board, 3);

				expect(boardDoService.move).toHaveBeenCalledWith(column, board, 3);
			});
		});
	});
});
