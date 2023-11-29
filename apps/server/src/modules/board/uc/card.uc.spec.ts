import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ContentElementType, PermissionCrud } from '@shared/domain';
import { columnBoardFactory, columnFactory, setupEntities, userFactory } from '@shared/testing';
import { cardFactory, richTextElementFactory } from '@shared/testing/factory/domainobject';
import { LegacyLogger } from '@src/core/logger';
import { AuthorizationService, PermissionContextService } from '@modules/authorization';
import { BoardDoAuthorizableService, ContentElementService, CardService } from '../service';
import { CardUc } from './card.uc';

describe(CardUc.name, () => {
	let module: TestingModule;
	let uc: CardUc;
	let authorizationService: DeepMocked<AuthorizationService>;
	let cardService: DeepMocked<CardService>;
	let elementService: DeepMocked<ContentElementService>;
	let permissionContextService: DeepMocked<PermissionContextService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CardUc,
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
					provide: ContentElementService,
					useValue: createMock<ContentElementService>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: PermissionContextService,
					useValue: createMock<PermissionContextService>(),
				},
			],
		}).compile();

		uc = module.get(CardUc);
		authorizationService = module.get(AuthorizationService);
		permissionContextService = module.get(PermissionContextService);

		cardService = module.get(CardService);
		elementService = module.get(ContentElementService);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('findCards', () => {
		describe('when finding many cards', () => {
			const setup = () => {
				const user = userFactory.build();
				const cards = cardFactory.buildList(3);
				const cardIds = cards.map((c) => c.id);

				permissionContextService.resolvePermissions.mockResolvedValueOnce([PermissionCrud.READ]);

				return { user, cards, cardIds };
			};

			it('should call the service', async () => {
				const { user, cardIds } = setup();

				await uc.findCards(user.id, cardIds);

				expect(cardService.findByIds).toHaveBeenCalledWith(cardIds);
			});

			it('should return the card objects', async () => {
				const { user, cards, cardIds } = setup();
				cardService.findByIds.mockResolvedValueOnce(cards);

				const result = await uc.findCards(user.id, cardIds);

				expect(result).toEqual(cards);
			});
		});
	});

	describe('deleteCard', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const board = columnBoardFactory.build();
			const boardId = board.id;
			const column = columnFactory.build();
			const card = cardFactory.build();
			authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

			const createCardBodyParams = {
				requiredEmptyElements: [ContentElementType.FILE, ContentElementType.RICH_TEXT],
			};
			permissionContextService.resolvePermissions.mockResolvedValueOnce([PermissionCrud.DELETE]);

			return { user, board, boardId, column, card, createCardBodyParams };
		};

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

	describe('updateCardHeight', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const board = columnBoardFactory.build();
			const boardId = board.id;
			const column = columnFactory.build();
			const card = cardFactory.build();
			authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

			permissionContextService.resolvePermissions.mockResolvedValueOnce([PermissionCrud.UPDATE]);

			const createCardBodyParams = {
				requiredEmptyElements: [ContentElementType.FILE, ContentElementType.RICH_TEXT],
			};

			return { user, board, boardId, column, card, createCardBodyParams };
		};

		describe('when updating a card height', () => {
			it('should call the service to find the card', async () => {
				const { user, card } = setup();
				const cardHeight = 200;

				await uc.updateCardHeight(user.id, card.id, cardHeight);

				expect(cardService.findById).toHaveBeenCalledWith(card.id);
			});

			it('should check the permission', async () => {
				const { user, card } = setup();
				const cardHeight = 200;

				await uc.updateCardHeight(user.id, card.id, cardHeight);

				// eslint-disable-next-line @typescript-eslint/dot-notation
				expect(uc['pocCheckPermission']).toHaveBeenCalled();
			});

			it('should call the service to update the card height', async () => {
				const { user, card } = setup();
				cardService.findById.mockResolvedValueOnce(card);
				const newHeight = 250;

				await uc.updateCardHeight(user.id, card.id, newHeight);

				expect(cardService.updateHeight).toHaveBeenCalledWith(card, newHeight);
			});
		});
	});

	describe('updateCardTitle', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const board = columnBoardFactory.build();
			const boardId = board.id;
			const column = columnFactory.build();
			const card = cardFactory.build();
			authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

			permissionContextService.resolvePermissions.mockResolvedValueOnce([PermissionCrud.UPDATE]);

			const createCardBodyParams = {
				requiredEmptyElements: [ContentElementType.FILE, ContentElementType.RICH_TEXT],
			};

			return { user, board, boardId, column, card, createCardBodyParams };
		};

		describe('when updating a card title', () => {
			it('should call the service to find the card', async () => {
				const { user, card } = setup();

				await uc.updateCardTitle(user.id, card.id, 'new title');

				expect(cardService.findById).toHaveBeenCalledWith(card.id);
			});

			it('should call the service to update the card title', async () => {
				const { user, card } = setup();
				cardService.findById.mockResolvedValueOnce(card);
				const newTitle = 'new title';

				await uc.updateCardTitle(user.id, card.id, newTitle);

				expect(cardService.updateTitle).toHaveBeenCalledWith(card, newTitle);
			});
		});
	});

	describe('createElement', () => {
		describe('when creating a content element', () => {
			const setup = () => {
				const user = userFactory.build();
				const card = cardFactory.build();
				const element = richTextElementFactory.build();

				cardService.findById.mockResolvedValueOnce(card);
				elementService.create.mockResolvedValueOnce(element);

				permissionContextService.resolvePermissions.mockResolvedValueOnce([PermissionCrud.CREATE]);

				return { user, card, element };
			};

			it('should call the service to find the card', async () => {
				const { user, card } = setup();

				await uc.createElement(user.id, card.id, ContentElementType.RICH_TEXT);

				expect(cardService.findById).toHaveBeenCalledWith(card.id);
			});

			it('should call the service to create the content element', async () => {
				const { user, card } = setup();

				await uc.createElement(user.id, card.id, ContentElementType.RICH_TEXT);

				expect(elementService.create).toHaveBeenCalledWith(card, ContentElementType.RICH_TEXT);
			});
			it('should call the service to move the element', async () => {
				const { user, card, element } = setup();

				await uc.createElement(user.id, card.id, ContentElementType.RICH_TEXT, 3);

				expect(elementService.move).toHaveBeenCalledWith(element, card, 3);
			});
			it('should not call the service to move the element if position is not a number', async () => {
				const { user, card } = setup();

				await uc.createElement(user.id, card.id, ContentElementType.RICH_TEXT, 'not a number' as unknown as number);

				expect(elementService.move).not.toHaveBeenCalled();
			});

			it('should return new content element', async () => {
				const { user, card, element } = setup();

				const result = await uc.createElement(user.id, card.id, ContentElementType.RICH_TEXT);

				expect(result).toEqual(element);
			});
		});
	});

	describe('moveElement', () => {
		describe('when moving an element', () => {
			const setup = () => {
				jest.restoreAllMocks();
				const user = userFactory.build();
				const element = richTextElementFactory.build();
				const card = cardFactory.build();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				permissionContextService.resolvePermissions.mockResolvedValue([PermissionCrud.UPDATE]);

				return { user, card, element };
			};

			it('should call the service to find the element', async () => {
				const { user, element, card } = setup();

				await uc.moveElement(user.id, element.id, card.id, 3);

				expect(elementService.findById).toHaveBeenCalledWith(element.id);
			});

			it('should call the service to find the target card', async () => {
				const { user, element, card } = setup();

				await uc.moveElement(user.id, element.id, card.id, 3);

				expect(cardService.findById).toHaveBeenCalledWith(card.id);
			});

			it('should call the service to move the element', async () => {
				const { user, element, card } = setup();
				elementService.findById.mockResolvedValueOnce(element);
				cardService.findById.mockResolvedValueOnce(card);

				await uc.moveElement(user.id, element.id, card.id, 3);

				expect(elementService.move).toHaveBeenCalledWith(element, card, 3);
			});
		});
	});
});
