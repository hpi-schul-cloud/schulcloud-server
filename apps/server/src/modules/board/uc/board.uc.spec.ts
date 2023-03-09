import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, userFactory } from '@shared/testing';
import { columnBoardFactory } from '@shared/testing/factory/domainobject';
import { Logger } from '@src/core/logger';
import { BoardNodeRepo, ColumnBoardRepo } from '../repo';
import { BoardUc } from './board.uc';

describe(BoardUc.name, () => {
	let module: TestingModule;
	let uc: BoardUc;
	let columnBoardRepo: DeepMocked<ColumnBoardRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardUc,
				{
					provide: ColumnBoardRepo,
					useValue: createMock<ColumnBoardRepo>(),
				},
				{
					provide: BoardNodeRepo,
					useValue: createMock<BoardNodeRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		uc = module.get(BoardUc);
		columnBoardRepo = module.get(ColumnBoardRepo);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
		jest.clearAllMocks();
	});

	const setup = () => {
		const user = userFactory.buildWithId();
		const board = columnBoardFactory.build();
		const boardId = board.id;

		return { user, board, boardId };
	};

	describe('finding a board', () => {
		it('should call the card repository', async () => {
			const { user, boardId } = setup();

			await uc.findBoard(user.id, boardId);

			expect(columnBoardRepo.findById).toHaveBeenCalledWith(boardId);
		});

		it('should return the columnBoard object of the given', async () => {
			const { user, board } = setup();
			columnBoardRepo.findById.mockResolvedValueOnce(board);

			const result = await uc.findBoard(user.id, board.id);
			expect(result).toEqual(board);
		});

		it('should throw not found exception if board does not exist', async () => {
			const { user } = setup();
			const error = new Error('not found');
			columnBoardRepo.findById.mockRejectedValueOnce(error);

			const notExistingBoardId = new ObjectId().toHexString();

			await expect(async () => uc.findBoard(user.id, notExistingBoardId)).rejects.toThrow(error);
		});
	});
});
