import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, userFactory } from '@shared/testing';
import { columnBoardFactory, columnFactory } from '@shared/testing/factory/domainobject';
import { Logger } from '@src/core/logger';
import { BoardDoService } from '../service';
import { ColumnBoardService } from '../service/column-board.service';
import { BoardUc } from './board.uc';

describe(BoardUc.name, () => {
	let module: TestingModule;
	let uc: BoardUc;
	let columnBoardService: DeepMocked<ColumnBoardService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardUc,
				{
					provide: BoardDoService,
					useValue: createMock<BoardDoService>(),
				},
				{
					provide: ColumnBoardService,
					useValue: createMock<ColumnBoardService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		uc = module.get(BoardUc);
		columnBoardService = module.get(ColumnBoardService);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	const setup = () => {
		const user = userFactory.buildWithId();
		const board = columnBoardFactory.build();
		const boardId = board.id;
		const column = columnFactory.build();

		return { user, board, boardId, column };
	};

	describe('finding a board', () => {
		it('should call the service', async () => {
			const { user, boardId } = setup();

			await uc.findBoard(user.id, boardId);

			expect(columnBoardService.findById).toHaveBeenCalledWith(boardId);
		});

		it('should return the column board object', async () => {
			const { user, board } = setup();
			columnBoardService.findById.mockResolvedValueOnce(board);

			const result = await uc.findBoard(user.id, board.id);
			expect(result).toEqual(board);
		});
	});

	describe('creating a board', () => {
		it('should call the service', async () => {
			const { user } = setup();

			await uc.createBoard(user.id);

			expect(columnBoardService.createBoard).toHaveBeenCalled();
		});

		it('should return the column board object', async () => {
			const { user, board } = setup();
			columnBoardService.createBoard.mockResolvedValueOnce(board);

			const result = await uc.createBoard(user.id);
			expect(result).toEqual(board);
		});
	});

	describe('creating a column', () => {
		it('should call the service to find the board', async () => {
			const { user, board } = setup();

			await uc.createColumn(user.id, board.id);

			expect(columnBoardService.findById).toHaveBeenCalledWith(board.id);
		});

		it('should call the service to create the column', async () => {
			const { user, board } = setup();
			columnBoardService.findById.mockResolvedValueOnce(board);

			await uc.createColumn(user.id, board.id);

			expect(columnBoardService.createColumn).toHaveBeenCalledWith(board.id);
		});

		it('should return the column board object', async () => {
			const { user, board, column } = setup();
			columnBoardService.createColumn.mockResolvedValueOnce(column);

			const result = await uc.createColumn(user.id, board.id);
			expect(result).toEqual(column);
		});
	});
});
