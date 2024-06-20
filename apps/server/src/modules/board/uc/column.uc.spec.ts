import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Action } from '@modules/authorization';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, userFactory } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { BoardNodeFactory, Card, Column, ContentElementType } from '../domain';
import { BoardNodeService } from '../service';
import { BoardNodePermissionService } from '../service/board-node-permission.service';
import { cardFactory, columnBoardFactory, columnFactory } from '../testing';
import { ColumnUc } from './column.uc';

describe(ColumnUc.name, () => {
	let module: TestingModule;
	let uc: ColumnUc;

	let boardNodePermissionService: DeepMocked<BoardNodePermissionService>;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let boardNodeFactory: DeepMocked<BoardNodeFactory>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ColumnUc,
				{
					provide: BoardNodePermissionService,
					useValue: createMock<BoardNodePermissionService>(),
				},
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
				{
					provide: BoardNodeFactory,
					useValue: createMock<BoardNodeFactory>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		uc = module.get(ColumnUc);
		boardNodePermissionService = module.get(BoardNodePermissionService);
		boardNodeService = module.get(BoardNodeService);
		boardNodeFactory = module.get(BoardNodeFactory);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	const setup = () => {
		const user = userFactory.buildWithId();
		const board = columnBoardFactory.build();
		const boardId = board.id;
		const column = columnFactory.build();
		const card = cardFactory.build();

		const createCardBodyParams = {
			requiredEmptyElements: [ContentElementType.FILE, ContentElementType.RICH_TEXT],
		};

		return { user, board, boardId, column, card, createCardBodyParams };
	};

	describe('deleteColumn', () => {
		describe('when deleting a column', () => {
			it('should call the service to find the column', async () => {
				const { user, column } = setup();

				await uc.deleteColumn(user.id, column.id);

				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(Column, column.id);
			});

			it('should call the Board Permission Service to check the user permission', async () => {
				const { user, column } = setup();
				boardNodeService.findByClassAndId.mockResolvedValueOnce(column);

				await uc.deleteColumn(user.id, column.id);

				expect(boardNodePermissionService.checkPermission).toHaveBeenCalledWith(user.id, column, Action.write);
			});

			it('should call the service to delete the column', async () => {
				const { user, column } = setup();
				boardNodeService.findByClassAndId.mockResolvedValueOnce(column);

				await uc.deleteColumn(user.id, column.id);

				expect(boardNodeService.delete).toHaveBeenCalledWith(column);
			});
		});
	});

	describe('updateColumnTitle', () => {
		describe('when updating a column title', () => {
			it('should call the service to find the column', async () => {
				const { user, column } = setup();

				await uc.updateColumnTitle(user.id, column.id, 'new title');

				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(Column, column.id);
			});

			it('should call the Board Permission Service to check the user permission', async () => {
				const { user, column } = setup();
				boardNodeService.findByClassAndId.mockResolvedValueOnce(column);

				await uc.updateColumnTitle(user.id, column.id, 'new title');

				expect(boardNodePermissionService.checkPermission).toHaveBeenCalledWith(user.id, column, Action.write);
			});

			it('should call the service to update the column title', async () => {
				const { user, column } = setup();
				boardNodeService.findByClassAndId.mockResolvedValueOnce(column);
				const newTitle = 'new title';

				await uc.updateColumnTitle(user.id, column.id, newTitle);

				expect(boardNodeService.updateTitle).toHaveBeenCalledWith(column, newTitle);
			});
		});
	});

	describe('createCard', () => {
		describe('when creating a card', () => {
			it('should call the service to find the column', async () => {
				const { user, column } = setup();

				await uc.createCard(user.id, column.id);

				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(Column, column.id);
			});

			it('should call the service to check the permissions', async () => {
				const { user, column } = setup();
				boardNodeService.findByClassAndId.mockResolvedValueOnce(column);

				await uc.createCard(user.id, column.id);

				expect(boardNodePermissionService.checkPermission).toHaveBeenCalledWith(user.id, column, Action.write);
			});

			it('should call the factory to build card', async () => {
				const { user, column, card } = setup();
				boardNodeFactory.buildCard.mockReturnValueOnce(card);

				await uc.createCard(user.id, column.id);

				expect(boardNodeFactory.buildCard).toHaveBeenCalled();
			});

			it('should call the service to create the card', async () => {
				const { user, column, card, createCardBodyParams } = setup();
				const { requiredEmptyElements } = createCardBodyParams;
				boardNodeFactory.buildCard.mockReturnValueOnce(card);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(column);

				await uc.createCard(user.id, column.id, requiredEmptyElements);

				expect(boardNodeService.addToParent).toHaveBeenCalledWith(column, card);
			});

			it('should return the card object', async () => {
				const { user, column, card } = setup();
				boardNodeFactory.buildCard.mockReturnValueOnce(card);

				const result = await uc.createCard(user.id, column.id);

				expect(result).toEqual(card);
			});
		});
	});

	describe('moveCard', () => {
		describe('when moving a card', () => {
			it('should call the service to find the card', async () => {
				const { user, column, card } = setup();

				await uc.moveCard(user.id, card.id, column.id, 5);

				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(Card, card.id);
			});

			it('should call the service to find the target column', async () => {
				const { user, column, card } = setup();

				await uc.moveCard(user.id, card.id, column.id, 5);

				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(Column, column.id);
			});

			it('should call the service to check the permissions for card', async () => {
				const { user, column, card } = setup();
				boardNodeService.findByClassAndId.mockResolvedValueOnce(card);

				await uc.moveCard(user.id, card.id, column.id, 5);

				expect(boardNodePermissionService.checkPermission).toHaveBeenCalledWith(user.id, card, Action.write);
			});

			it('should call the service to check the user permission for the target column', async () => {
				const { user, column, card } = setup();
				boardNodeService.findByClassAndId.mockResolvedValueOnce(column);

				await uc.moveCard(user.id, card.id, column.id, 5);

				expect(boardNodePermissionService.checkPermission).toHaveBeenCalledWith(user.id, column, Action.write);
			});

			it('should call the service to move the card', async () => {
				const { user, column, card } = setup();
				boardNodeService.findByClassAndId.mockResolvedValueOnce(card);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(column);

				await uc.moveCard(user.id, card.id, column.id, 5);

				expect(boardNodeService.move).toHaveBeenCalledWith(card, column, 5);
			});
		});
	});
});
