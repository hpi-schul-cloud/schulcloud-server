import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Action, AuthorizationService } from '@modules/authorization';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, userFactory } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { BoardNodeAuthorizable, BoardNodeFactory, Card, ContentElementType } from '../domain';
import { BoardNodeAuthorizableService, BoardNodePermissionService, BoardNodeService } from '../service';
import { cardFactory, columnBoardFactory, richTextElementFactory } from '../testing';
import { CardUc } from './card.uc';

describe(CardUc.name, () => {
	let module: TestingModule;
	let uc: CardUc;
	let authorizationService: DeepMocked<AuthorizationService>;
	let boardNodeAuthorizableService: DeepMocked<BoardNodeAuthorizableService>;
	let boardNodePermissionService: DeepMocked<BoardNodePermissionService>;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let boardNodeFactory: DeepMocked<BoardNodeFactory>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CardUc,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: BoardNodeAuthorizableService,
					useValue: createMock<BoardNodeAuthorizableService>(),
				},
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

		uc = module.get(CardUc);
		authorizationService = module.get(AuthorizationService);
		boardNodeAuthorizableService = module.get(BoardNodeAuthorizableService);
		boardNodePermissionService = module.get(BoardNodePermissionService);
		boardNodeService = module.get(BoardNodeService);
		boardNodeFactory = module.get(BoardNodeFactory);
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

				boardNodeAuthorizableService.getBoardAuthorizables.mockResolvedValue([
					new BoardNodeAuthorizable({
						users: [],
						id: cards[0].id,
						boardNode: cards[0],
						rootNode: columnBoardFactory.build(),
					}),
					new BoardNodeAuthorizable({
						users: [],
						id: cards[1].id,
						boardNode: cards[1],
						rootNode: columnBoardFactory.build(),
					}),
					new BoardNodeAuthorizable({
						users: [],
						id: cards[2].id,
						boardNode: cards[2],
						rootNode: columnBoardFactory.build(),
					}),
				]);
				authorizationService.hasPermission.mockReturnValue(true);

				return { user, cards, cardIds };
			};

			it('should call boardNodeService service to find cards', async () => {
				const { user, cardIds } = setup();

				await uc.findCards(user.id, cardIds);

				expect(boardNodeService.findByClassAndIds).toHaveBeenCalledWith(Card, cardIds);
			});

			it('should call the service to get the user with permissions', async () => {
				const { user, cards, cardIds } = setup();
				boardNodeService.findByClassAndIds.mockResolvedValueOnce(cards);

				await uc.findCards(user.id, cardIds);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(user.id);
			});

			it('should call the service to filter by authorization', async () => {
				const { user, cards, cardIds } = setup();
				boardNodeService.findByClassAndIds.mockResolvedValueOnce(cards);

				await uc.findCards(user.id, cardIds);

				expect(boardNodeAuthorizableService.getBoardAuthorizables).toHaveBeenCalledTimes(1);
			});

			it('should call the service to check the user permission', async () => {
				const { user, cards, cardIds } = setup();
				boardNodeService.findByClassAndIds.mockResolvedValueOnce(cards);

				await uc.findCards(user.id, cardIds);

				expect(authorizationService.hasPermission).toHaveBeenCalledTimes(3);
			});

			it('should return the card objects', async () => {
				const { user, cards, cardIds } = setup();
				boardNodeService.findByClassAndIds.mockResolvedValueOnce(cards);

				const result = await uc.findCards(user.id, cardIds);

				expect(result).toEqual(cards);
			});
		});
	});

	describe('deleteCard', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const card = cardFactory.build();

			return { user, card };
		};

		describe('when deleting a card', () => {
			it('should call the service to find the card', async () => {
				const { user, card } = setup();
				boardNodeService.findByClassAndId.mockResolvedValueOnce(card);

				await uc.deleteCard(user.id, card.id);

				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(Card, card.id);
			});

			it('should call the Board Permission Service to check the user permission', async () => {
				const { user, card } = setup();
				boardNodeService.findByClassAndId.mockResolvedValueOnce(card);

				await uc.deleteCard(user.id, card.id);

				expect(boardNodePermissionService.checkPermission).toHaveBeenCalledWith(user.id, card, Action.write);
			});

			it('should call the service to delete the card', async () => {
				const { user, card } = setup();
				boardNodeService.findByClassAndId.mockResolvedValueOnce(card);

				await uc.deleteCard(user.id, card.id);

				expect(boardNodeService.delete).toHaveBeenCalledWith(card);
			});
		});
	});

	describe('updateCardHeight', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const card = cardFactory.build();

			return { user, card };
		};

		describe('when updating a card height', () => {
			it('should call the service to find the card', async () => {
				const { user, card } = setup();
				const cardHeight = 200;

				await uc.updateCardHeight(user.id, card.id, cardHeight);

				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(Card, card.id);
			});

			it('should call the Board Permission Service to check the user permission', async () => {
				const { user, card } = setup();
				const cardHeight = 200;
				boardNodeService.findByClassAndId.mockResolvedValueOnce(card);

				await uc.updateCardHeight(user.id, card.id, cardHeight);

				expect(boardNodePermissionService.checkPermission).toHaveBeenCalledWith(user.id, card, Action.write);
			});

			it('should call the service to update the card height', async () => {
				const { user, card } = setup();
				const newHeight = 250;
				boardNodeService.findByClassAndId.mockResolvedValueOnce(card);

				await uc.updateCardHeight(user.id, card.id, newHeight);

				expect(boardNodeService.updateHeight).toHaveBeenCalledWith(card, newHeight);
			});
		});
	});

	describe('updateCardTitle', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const card = cardFactory.build();

			return { user, card };
		};

		describe('when updating a card title', () => {
			it('should call the service to find the card', async () => {
				const { user, card } = setup();

				await uc.updateCardTitle(user.id, card.id, 'new title');

				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(Card, card.id);
			});

			it('should call the service to check the user permission', async () => {
				const { user, card } = setup();
				boardNodeService.findByClassAndId.mockResolvedValueOnce(card);

				await uc.updateCardTitle(user.id, card.id, 'new title');

				expect(boardNodePermissionService.checkPermission).toHaveBeenCalledWith(user.id, card, Action.write);
			});

			it('should call the service to update the card title', async () => {
				const { user, card } = setup();
				const newTitle = 'new title';
				boardNodeService.findByClassAndId.mockResolvedValueOnce(card);

				await uc.updateCardTitle(user.id, card.id, newTitle);

				expect(boardNodeService.updateTitle).toHaveBeenCalledWith(card, newTitle);
			});
		});
	});

	describe('createElement', () => {
		describe('when creating a content element', () => {
			const setup = () => {
				const user = userFactory.build();
				const card = cardFactory.build();
				const element = richTextElementFactory.build();

				return { user, card, element };
			};

			it('should call the service to find the card', async () => {
				const { user, card } = setup();

				await uc.createElement(user.id, card.id, ContentElementType.RICH_TEXT);

				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(Card, card.id);
			});

			it('should call the service to check the user permission', async () => {
				const { user, card } = setup();
				boardNodeService.findByClassAndId.mockResolvedValueOnce(card);

				await uc.createElement(user.id, card.id, ContentElementType.RICH_TEXT);

				expect(boardNodePermissionService.checkPermission).toHaveBeenCalledWith(user.id, card, Action.write);
			});

			it('should call the factory to build element', async () => {
				const { user, card } = setup();

				await uc.createElement(user.id, card.id, ContentElementType.RICH_TEXT);

				expect(boardNodeFactory.buildContentElement).toHaveBeenCalledWith(ContentElementType.RICH_TEXT);
			});

			it('should call the service to create add the content element to the card', async () => {
				const { user, card, element } = setup();
				boardNodeService.findByClassAndId.mockResolvedValueOnce(card);
				boardNodeFactory.buildContentElement.mockReturnValueOnce(element);

				await uc.createElement(user.id, card.id, ContentElementType.RICH_TEXT, 3);

				expect(boardNodeService.addToParent).toHaveBeenCalledWith(card, element, 3);
			});

			it('should return new content element', async () => {
				const { user, card, element } = setup();
				boardNodeFactory.buildContentElement.mockReturnValueOnce(element);

				const result = await uc.createElement(user.id, card.id, ContentElementType.RICH_TEXT);

				expect(result).toEqual(element);
			});
		});
	});

	describe('moveElement', () => {
		describe('when moving an element', () => {
			const setup = () => {
				const user = userFactory.build();
				const element = richTextElementFactory.build();
				const card = cardFactory.build();

				return { user, card, element };
			};

			it('should call the service to find the element', async () => {
				const { user, element, card } = setup();

				await uc.moveElement(user.id, element.id, card.id, 3);

				expect(boardNodeService.findContentElementById).toHaveBeenCalledWith(element.id);
			});

			it('should call the service to find the target card', async () => {
				const { user, element, card } = setup();

				await uc.moveElement(user.id, element.id, card.id, 3);

				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(Card, card.id);
			});

			it('should call the service to check the user permission for the element', async () => {
				const { user, element, card } = setup();
				boardNodeService.findContentElementById.mockResolvedValueOnce(element);

				await uc.moveElement(user.id, element.id, card.id, 3);

				expect(boardNodePermissionService.checkPermission).toHaveBeenCalledWith(user.id, element, Action.write);
			});

			it('should call the service to check the user permission for the target card', async () => {
				const { user, element, card } = setup();
				boardNodeService.findByClassAndId.mockResolvedValueOnce(card);

				await uc.moveElement(user.id, element.id, card.id, 3);

				expect(boardNodePermissionService.checkPermission).toHaveBeenCalledWith(user.id, card, Action.write);
			});

			it('should call the service to move the element', async () => {
				const { user, element, card } = setup();
				boardNodeService.findContentElementById.mockResolvedValueOnce(element);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(card);

				await uc.moveElement(user.id, element.id, card.id, 3);

				expect(boardNodeService.move).toHaveBeenCalledWith(element, card, 3);
			});
		});
	});
});
