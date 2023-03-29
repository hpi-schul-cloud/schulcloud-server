import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, userFactory } from '@shared/testing';
import { cardFactory, columnBoardFactory, columnFactory } from '@shared/testing/factory/domainobject';
import { Logger } from '@src/core/logger';
import { BoardDoService, CardService, ColumnService } from '../service';
import { ColumnBoardService } from '../service/column-board.service';
import { BoardUc } from './board.uc';

describe(BoardUc.name, () => {
	let module: TestingModule;
	let uc: BoardUc;
	let columnBoardService: DeepMocked<ColumnBoardService>;
	let columnService: DeepMocked<ColumnService>;
	let cardService: DeepMocked<CardService>;

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
					provide: ColumnService,
					useValue: createMock<ColumnService>(),
				},
				{
					provide: CardService,
					useValue: createMock<CardService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		uc = module.get(BoardUc);
		columnBoardService = module.get(ColumnBoardService);
		columnService = module.get(ColumnService);
		cardService = module.get(CardService);
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
		const card = cardFactory.build();

		return { user, board, boardId, column, card };
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

			expect(columnBoardService.create).toHaveBeenCalled();
		});

		it('should return the column board object', async () => {
			const { user, board } = setup();
			columnBoardService.create.mockResolvedValueOnce(board);

			const result = await uc.createBoard(user.id);
			expect(result).toEqual(board);
		});
	});

	describe('deleting a board', () => {
		it('should call the service to delete the board', async () => {
			const { user, board } = setup();

			await uc.deleteBoard(user.id, board.id);

			expect(columnBoardService.deleteById).toHaveBeenCalledWith(board.id);
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

			expect(columnService.create).toHaveBeenCalledWith(board.id);
		});

		it('should return the column board object', async () => {
			const { user, board, column } = setup();
			columnService.create.mockResolvedValueOnce(column);

			const result = await uc.createColumn(user.id, board.id);
			expect(result).toEqual(column);
		});
	});

	describe('deleting a column', () => {
		it('should call the service to delete the column', async () => {
			const { user, board, column } = setup();

			await uc.deleteColumn(user.id, board.id, column.id);

			expect(columnService.deleteById).toHaveBeenCalledWith(column.id);
		});
	});

	describe('creating a card', () => {
		it('should call the service to create the card', async () => {
			const { user, board, column } = setup();

			await uc.createCard(user.id, board.id, column.id);

			expect(cardService.create).toHaveBeenCalledWith(column.id);
		});

		it('should return the card object', async () => {
			const { user, board, column, card } = setup();
			cardService.create.mockResolvedValueOnce(card);

			const result = await uc.createCard(user.id, board.id, column.id);

			expect(result).toEqual(card);
		});
	});

	describe('deleting a card', () => {
		it('should call the service to delete the card', async () => {
			const { user, board, column, card } = setup();

			await uc.deleteCard(user.id, board.id, column.id, card.id);

			expect(cardService.deleteById).toHaveBeenCalledWith(card.id);
		});
	});
});
