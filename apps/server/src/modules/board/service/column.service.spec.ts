import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
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

	describe('create', () => {
		describe('when creating a column', () => {
			const setup = () => {
				const board = columnBoardFactory.build();
				const boardId = board.id;

				return { board, boardId };
			};

			it('should save a list of columns using the repo', async () => {
				const { board, boardId } = setup();
				boardDoRepo.findByClassAndId.mockResolvedValueOnce(board);

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
		describe('when deleting a column by id', () => {
			it('should call the deleteByClassAndId of the board-do-repo', async () => {
				const board = columnBoardFactory.build();
				const column = columnFactory.build();

				await service.delete(board, column.id);

				expect(boardDoService.deleteChildWithDescendants).toHaveBeenCalledWith(board, column.id);
			});
		});
	});
});
