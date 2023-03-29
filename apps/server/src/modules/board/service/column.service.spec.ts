import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Column } from '@shared/domain';
import { setupEntities } from '@shared/testing';
import { columnBoardFactory, columnFactory } from '@shared/testing/factory/domainobject';
import { Logger } from '@src/core/logger';
import { BoardDoRepo } from '../repo';
import { ColumnService } from './column.service';

describe(ColumnService.name, () => {
	let module: TestingModule;
	let service: ColumnService;
	let boardDoRepo: DeepMocked<BoardDoRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ColumnService,
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

		service = module.get(ColumnService);
		boardDoRepo = module.get(BoardDoRepo);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('creating a column', () => {
		const setup = () => {
			const board = columnBoardFactory.build();
			const boardId = board.id;

			return { board, boardId };
		};

		it('should save a list of columns using the repo', async () => {
			const { board, boardId } = setup();
			boardDoRepo.findByClassAndId.mockResolvedValueOnce(board);

			await service.create(boardId);

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

	describe('when deleting a column by id', () => {
		it('should call the deleteByClassAndId of the board-do-repo', async () => {
			const column = columnFactory.build();

			await service.deleteById(column.id);

			expect(boardDoRepo.deleteByClassAndId).toHaveBeenCalledWith(Column, column.id);
		});
	});
});
