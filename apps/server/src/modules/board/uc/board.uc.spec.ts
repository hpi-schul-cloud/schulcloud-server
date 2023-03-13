import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, userFactory } from '@shared/testing';
import { columnBoardFactory } from '@shared/testing/factory/domainobject';
import { Logger } from '@src/core/logger';
import { ColumnBoardRepo } from '../repo';
import { ColumnBoardService } from '../service/column-board.service';
import { BoardUc } from './board.uc';

describe(BoardUc.name, () => {
	let module: TestingModule;
	let uc: BoardUc;
	let columnBoardService: DeepMocked<ColumnBoardRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardUc,
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

	describe('finding a board', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const board = columnBoardFactory.build();
			const boardId = board.id;

			return { user, board, boardId };
		};

		it('should call the card repository', async () => {
			const { user, boardId } = setup();

			await uc.findBoard(user.id, boardId);

			expect(columnBoardService.findById).toHaveBeenCalledWith(boardId);
		});

		it('should return the columnBoard object of the given', async () => {
			const { user, board } = setup();
			columnBoardService.findById.mockResolvedValueOnce(board);

			const result = await uc.findBoard(user.id, board.id);
			expect(result).toEqual(board);
		});

		it('should throw not found exception if board does not exist', async () => {
			const { user } = setup();
			const error = new Error('not found');
			columnBoardService.findById.mockRejectedValueOnce(error);

			const notExistingBoardId = new ObjectId().toHexString();

			await expect(async () => uc.findBoard(user.id, notExistingBoardId)).rejects.toThrow(error);
		});
	});
});
