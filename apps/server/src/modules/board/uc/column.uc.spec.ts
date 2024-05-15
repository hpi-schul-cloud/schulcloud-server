import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '@modules/authorization';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardDoAuthorizable, BoardRoles, ContentElementType } from '@shared/domain/domainobject';
import { setupEntities, userFactory } from '@shared/testing/factory';
import { cardFactory, columnBoardFactory, columnFactory } from '@shared/testing/factory/domainobject';
import { LegacyLogger } from '@src/core/logger';
import { BoardDoAuthorizableService, CardService, ColumnService, ContentElementService } from '../service';
import { ColumnUc } from './column.uc';

describe(ColumnUc.name, () => {
	let module: TestingModule;
	let uc: ColumnUc;
	let authorizationService: DeepMocked<AuthorizationService>;
	let boardDoAuthorizableService: DeepMocked<BoardDoAuthorizableService>;
	let columnService: DeepMocked<ColumnService>;
	let cardService: DeepMocked<CardService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ColumnUc,
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
					provide: ColumnService,
					useValue: createMock<ColumnService>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: ContentElementService,
					useValue: createMock<ContentElementService>(),
				},
			],
		}).compile();

		uc = module.get(ColumnUc);
		authorizationService = module.get(AuthorizationService);
		boardDoAuthorizableService = module.get(BoardDoAuthorizableService);
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
			boardDo: board,
			rootDo: columnBoardFactory.build(),
		});
		const createCardBodyParams = {
			requiredEmptyElements: [ContentElementType.FILE, ContentElementType.RICH_TEXT],
		};

		boardDoAuthorizableService.findById.mockResolvedValueOnce(authorizableMock);

		return { user, board, boardId, column, card, createCardBodyParams };
	};

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
				const { user, column, createCardBodyParams } = setup();
				const { requiredEmptyElements } = createCardBodyParams;

				await uc.createCard(user.id, column.id, requiredEmptyElements);

				expect(cardService.create).toHaveBeenCalledWith(column, requiredEmptyElements);
			});

			it('should return the card object', async () => {
				const { user, column, card } = setup();
				cardService.create.mockResolvedValueOnce(card);

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
});
