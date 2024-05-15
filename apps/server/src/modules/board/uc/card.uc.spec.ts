import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Action, AuthorizationService } from '@modules/authorization';
import { Test, TestingModule } from '@nestjs/testing';
import { columnBoardFactory, setupEntities, userFactory } from '@shared/testing/factory';
import { cardFactory, richTextElementFactory } from '@shared/testing/factory/domainobject';
import { LegacyLogger } from '@src/core/logger';
import { BoardNodeAuthorizable, ContentElementType } from '../domain';
import { BoardNodeAuthorizableService, BoardNodePermissionService } from '../service';
import { CardUc } from './card.uc';

describe(CardUc.name, () => {
	let module: TestingModule;
	let uc: CardUc;
	let authorizationService: DeepMocked<AuthorizationService>;
	let boardNodeAuthorizableService: DeepMocked<BoardNodeAuthorizableService>;
	let boardPermissionService: DeepMocked<BoardNodePermissionService>;

	let cardService: DeepMocked<CardService>;
	let elementService: DeepMocked<ContentElementService>;

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
			],
		}).compile();

		uc = module.get(CardUc);
		authorizationService = module.get(AuthorizationService);
		boardNodeAuthorizableService = module.get(BoardNodeAuthorizableService);
		boardPermissionService = module.get(BoardNodePermissionService);

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

				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValue(
					new BoardNodeAuthorizable({
						users: [],
						id: new ObjectId().toHexString(),
						boardDo: cards[0],
						rootDo: columnBoardFactory.build(),
					})
				);

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
			const card = cardFactory.build();

			return { user, card };
		};

		describe('when deleting a card', () => {
			it('should call the service to find the card', async () => {
				const { user, card } = setup();

				await uc.deleteCard(user.id, card.id);

				expect(cardService.findById).toHaveBeenCalledWith(card.id);
			});

			it('should call the Board Permission Service to check the user permission', async () => {
				const { user, card } = setup();
				cardService.findById.mockResolvedValueOnce(card);

				await uc.deleteCard(user.id, card.id);

				expect(boardPermissionService.checkPermission).toHaveBeenCalledWith(user.id, card, Action.write);
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
			const card = cardFactory.build();

			return { user, card };
		};

		describe('when updating a card height', () => {
			it('should call the service to find the card', async () => {
				const { user, card } = setup();
				const cardHeight = 200;

				await uc.updateCardHeight(user.id, card.id, cardHeight);

				expect(cardService.findById).toHaveBeenCalledWith(card.id);
			});

			it('should call the Board Permission Service to check the user permission', async () => {
				const { user, card } = setup();
				cardService.findById.mockResolvedValueOnce(card);
				const cardHeight = 200;

				await uc.updateCardHeight(user.id, card.id, cardHeight);

				expect(boardPermissionService.checkPermission).toHaveBeenCalledWith(user.id, card, Action.write);
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
			const card = cardFactory.build();

			return { user, card };
		};

		describe('when updating a card title', () => {
			it('should call the service to find the card', async () => {
				const { user, card } = setup();

				await uc.updateCardTitle(user.id, card.id, 'new title');

				expect(cardService.findById).toHaveBeenCalledWith(card.id);
			});

			it('should call the Board Permission Service to check the user permission', async () => {
				const { user, card } = setup();
				cardService.findById.mockResolvedValueOnce(card);

				await uc.updateCardTitle(user.id, card.id, 'new title');

				expect(boardPermissionService.checkPermission).toHaveBeenCalledWith(user.id, card, Action.write);
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

				return { user, card, element };
			};

			it('should call the service to find the card', async () => {
				const { user, card } = setup();

				await uc.createElement(user.id, card.id, ContentElementType.RICH_TEXT);

				expect(cardService.findById).toHaveBeenCalledWith(card.id);
			});

			it('should call the Board Permission Service to check the user permission', async () => {
				const { user, card } = setup();
				cardService.findById.mockResolvedValueOnce(card);

				await uc.createElement(user.id, card.id, ContentElementType.RICH_TEXT);

				expect(boardPermissionService.checkPermission).toHaveBeenCalledWith(user.id, card, Action.write);
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
				const user = userFactory.build();
				const element = richTextElementFactory.build();
				const card = cardFactory.build();

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

			it('should call the Board Permission Service to check the user permission for the element', async () => {
				const { user, element, card } = setup();
				elementService.findById.mockResolvedValueOnce(element);

				await uc.moveElement(user.id, element.id, card.id, 3);

				expect(boardPermissionService.checkPermission).toHaveBeenCalledWith(user.id, element, Action.write);
			});

			it('should call the Board Permission Service to check the user permission for the target card', async () => {
				const { user, element, card } = setup();
				cardService.findById.mockResolvedValueOnce(card);

				await uc.moveElement(user.id, element.id, card.id, 3);

				expect(boardPermissionService.checkPermission).toHaveBeenCalledWith(user.id, card, Action.write);
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
