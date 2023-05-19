import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardDoAuthorizable, BoardRoles } from '@shared/domain/domainobject/board';
import { setupEntities, userFactory } from '@shared/testing';
import { cardFactory, columnBoardFactory, columnFactory } from '@shared/testing/factory/domainobject';
import { LegacyLogger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { ObjectId } from 'bson';
import { BoardDoAuthorizableService } from '../service/board-do-authorizable.service';
import { CardService } from '../service/card.service';
import { ColumnBoardService } from '../service/column-board.service';
import { ColumnService } from '../service/column.service';
import { BoardUc } from './board.uc';

describe(BoardUc.name, () => {
	let module: TestingModule;
	let uc: BoardUc;
	let authorizationService: DeepMocked<AuthorizationService>;
	let boardDoAuthorizableService: DeepMocked<BoardDoAuthorizableService>;
	let columnBoardService: DeepMocked<ColumnBoardService>;
	let columnService: DeepMocked<ColumnService>;
	let cardService: DeepMocked<CardService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardUc,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: BoardDoAuthorizableService,
					useValue: createMock<BoardDoAuthorizableService>(),
				},
				{
					provide: CardService,
					useValue: createMock<CardService>(),
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
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		uc = module.get(BoardUc);
		authorizationService = module.get(AuthorizationService);
		boardDoAuthorizableService = module.get(BoardDoAuthorizableService);
		columnBoardService = module.get(ColumnBoardService);
		columnService = module.get(ColumnService);
		cardService = module.get(CardService);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	const setup = () => {
		jest.clearAllMocks();
		const user = userFactory.buildWithId();
		const board = columnBoardFactory.build();
		const boardId = board.id;
		const column = columnFactory.build();
		const card = cardFactory.build();
		authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

		const authorizableMock: BoardDoAuthorizable = new BoardDoAuthorizable({
			users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
			id: board.id,
		});

		boardDoAuthorizableService.findById.mockResolvedValueOnce(authorizableMock);

		return { user, board, boardId, column, card };
	};

	describe('findBoard', () => {
		describe('when loading a board and having required permission', () => {
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

		describe('when loading a board without having permissions', () => {
			it('should return the column board object', async () => {
				const { board } = setup();
				columnBoardService.findById.mockResolvedValueOnce(board);

				const fakeUserId = new ObjectId().toHexString();
				authorizationService.checkPermission.mockImplementationOnce(() => {
					throw new ForbiddenException();
				});

				await expect(uc.findBoard(fakeUserId, board.id)).rejects.toThrow(ForbiddenException);
			});
		});
	});

	describe('deleteBoard', () => {
		describe('when deleting a board', () => {
			it('should call the service to find the board', async () => {
				const { user, board } = setup();

				await uc.deleteBoard(user.id, board.id);

				expect(columnBoardService.findById).toHaveBeenCalledWith(board.id);
			});

			it('should call the service to delete the board', async () => {
				const { user, board } = setup();

				await uc.deleteBoard(user.id, board.id);

				expect(columnBoardService.delete).toHaveBeenCalledWith(board);
			});
		});
	});

	describe('updateBoardTitle', () => {
		describe('when updating a board title', () => {
			it('should call the service to find the board', async () => {
				const { user, board } = setup();

				await uc.updateBoardTitle(user.id, board.id, 'new title');

				expect(columnBoardService.findById).toHaveBeenCalledWith(board.id);
			});

			it('should call the service to update the board title', async () => {
				const { user, board } = setup();
				const newTitle = 'new title';

				await uc.updateBoardTitle(user.id, board.id, newTitle);

				expect(columnBoardService.updateTitle).toHaveBeenCalledWith(board, newTitle);
			});
		});
	});

	describe('createColumn', () => {
		describe('when creating a column', () => {
			it('should call the service to find the board', async () => {
				const { user, board } = setup();

				await uc.createColumn(user.id, board.id);

				expect(columnBoardService.findById).toHaveBeenCalledWith(board.id);
			});

			it('should call the service to create the column', async () => {
				const { user, board } = setup();
				columnBoardService.findById.mockResolvedValueOnce(board);

				await uc.createColumn(user.id, board.id);

				expect(columnService.create).toHaveBeenCalledWith(board);
			});

			it('should return the column board object', async () => {
				const { user, board, column } = setup();
				columnService.create.mockResolvedValueOnce(column);

				const result = await uc.createColumn(user.id, board.id);

				expect(result).toEqual(column);
			});
		});
	});

	describe('deleteColumn', () => {
		describe('when deleting a column', () => {
			it('should call the service to find the column', async () => {
				const { user, column } = setup();

				await uc.deleteColumn(user.id, column.id);

				expect(columnService.findById).toHaveBeenCalledWith(column.id);
			});

			it('should call the service to delete the column', async () => {
				const { user, column } = setup();
				columnService.findById.mockResolvedValueOnce(column);

				await uc.deleteColumn(user.id, column.id);

				expect(columnService.delete).toHaveBeenCalledWith(column);
			});
		});
	});

	describe('moveColumn', () => {
		describe('when moving a column', () => {
			it('should call the service to find the column', async () => {
				const { user, board, column } = setup();

				await uc.moveColumn(user.id, column.id, board.id, 7);

				expect(columnService.findById).toHaveBeenCalledWith(column.id);
			});

			it('should call the service to find the target board', async () => {
				const { user, board, column } = setup();

				await uc.moveColumn(user.id, column.id, board.id, 7);

				expect(columnBoardService.findById).toHaveBeenCalledWith(board.id);
			});

			it('should call the service to move the column', async () => {
				const { user, board, column } = setup();
				columnService.findById.mockResolvedValueOnce(column);
				columnBoardService.findById.mockResolvedValueOnce(board);

				await uc.moveColumn(user.id, board.id, column.id, 7);

				expect(columnService.move).toHaveBeenCalledWith(column, board, 7);
			});
		});
	});

	describe('updateColumnTitle', () => {
		describe('when updating a column title', () => {
			it('should call the service to find the column', async () => {
				const { user, column } = setup();

				await uc.updateColumnTitle(user.id, column.id, 'new title');

				expect(columnService.findById).toHaveBeenCalledWith(column.id);
			});

			it('should call the service to update the column title', async () => {
				const { user, column } = setup();
				columnService.findById.mockResolvedValueOnce(column);
				const newTitle = 'new title';

				await uc.updateColumnTitle(user.id, column.id, newTitle);

				expect(columnService.updateTitle).toHaveBeenCalledWith(column, newTitle);
			});
		});
	});

	describe('createCard', () => {
		describe('when creating a card', () => {
			it('should call the service to create the card', async () => {
				const { user, column } = setup();

				await uc.createCard(user.id, column.id);

				expect(cardService.create).toHaveBeenCalledWith(column);
			});

			it('should return the card object', async () => {
				const { user, column, card } = setup();
				cardService.create.mockResolvedValueOnce(card);

				const result = await uc.createCard(user.id, column.id);

				expect(result).toEqual(card);
			});
		});
	});

	describe('deleteCard', () => {
		describe('when deleting a card', () => {
			it('should call the service to find the card', async () => {
				const { user, card } = setup();

				await uc.deleteCard(user.id, card.id);

				expect(cardService.findById).toHaveBeenCalledWith(card.id);
			});

			it('should call the service to delete the card', async () => {
				const { user, card } = setup();
				cardService.findById.mockResolvedValueOnce(card);

				await uc.deleteCard(user.id, card.id);

				expect(cardService.delete).toHaveBeenCalledWith(card);
			});
		});
	});

	describe('moveCard', () => {
		describe('when moving a card', () => {
			it('should call the service to find the card', async () => {
				const { user, column, card } = setup();

				await uc.moveCard(user.id, card.id, column.id, 5);

				expect(cardService.findById).toHaveBeenCalledWith(card.id);
			});

			it('should call the service to find the target column', async () => {
				const { user, column, card } = setup();

				await uc.moveCard(user.id, card.id, column.id, 5);

				expect(columnService.findById).toHaveBeenCalledWith(column.id);
			});

			it('should call the service to move the card', async () => {
				const { user, column, card } = setup();
				cardService.findById.mockResolvedValueOnce(card);
				columnService.findById.mockResolvedValueOnce(column);

				await uc.moveCard(user.id, card.id, column.id, 5);

				expect(cardService.move).toHaveBeenCalledWith(card, column, 5);
			});
		});
	});

	describe('updateCardTitle', () => {
		describe('when updating a card title', () => {
			it('should call the service to find the card', async () => {
				const { user, card } = setup();

				await uc.updateCardTitle(user.id, card.id, 'new title');

				expect(cardService.findById).toHaveBeenCalledWith(card.id);
			});

			it('should call the service to update the column title', async () => {
				const { user, card } = setup();
				columnService.findById.mockResolvedValueOnce(card);
				const newTitle = 'new title';

				await uc.updateCardTitle(user.id, card.id, newTitle);

				expect(cardService.updateTitle).toHaveBeenCalledWith(card, newTitle);
			});
		});
	});
});
