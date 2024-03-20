import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '@modules/authorization';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardDoAuthorizable, BoardRoles, ContentElementType } from '@shared/domain/domainobject';
import { columnBoardFactory, columnFactory, setupEntities, userFactory } from '@shared/testing';
import { cardFactory, richTextElementFactory } from '@shared/testing/factory/domainobject';
import { LegacyLogger } from '@src/core/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardDoAuthorizableService, CardService, ContentElementService } from '../service';
import { CardUc } from './card.uc';

describe(CardUc.name, () => {
	let module: TestingModule;
	let uc: CardUc;
	let authorizationService: DeepMocked<AuthorizationService>;
	let boardDoAuthorizableService: DeepMocked<BoardDoAuthorizableService>;
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
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
			],
		}).compile();

		uc = module.get(CardUc);
		authorizationService = module.get(AuthorizationService);
		boardDoAuthorizableService = module.get(BoardDoAuthorizableService);

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

				boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValue(
					new BoardDoAuthorizable({
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
			const board = columnBoardFactory.build();
			const boardId = board.id;
			const column = columnFactory.build();
			const card = cardFactory.build();
			authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

			const authorizableMock: BoardDoAuthorizable = new BoardDoAuthorizable({
				users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
				id: board.id,
				boardDo: card,
				rootDo: board,
			});
			const createCardBodyParams = {
				requiredEmptyElements: [ContentElementType.FILE, ContentElementType.RICH_TEXT],
			};

			boardDoAuthorizableService.findById.mockResolvedValueOnce(authorizableMock);

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

			const authorizableMock: BoardDoAuthorizable = new BoardDoAuthorizable({
				users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
				id: board.id,
				boardDo: card,
				rootDo: board,
			});
			const createCardBodyParams = {
				requiredEmptyElements: [ContentElementType.FILE, ContentElementType.RICH_TEXT],
			};

			boardDoAuthorizableService.findById.mockResolvedValueOnce(authorizableMock);

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

				expect(authorizationService.checkPermission).toHaveBeenCalled();
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

			const authorizableMock: BoardDoAuthorizable = new BoardDoAuthorizable({
				users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
				id: card.id,
				boardDo: card,
				rootDo: board,
			});
			const createCardBodyParams = {
				requiredEmptyElements: [ContentElementType.FILE, ContentElementType.RICH_TEXT],
			};

			boardDoAuthorizableService.findById.mockResolvedValueOnce(authorizableMock);

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

				boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValue(
					new BoardDoAuthorizable({
						users: [],
						id: new ObjectId().toHexString(),
						boardDo: card,
						rootDo: columnBoardFactory.build(),
					})
				);

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
				const user = userFactory.build();
				const element = richTextElementFactory.build();
				const card = cardFactory.build();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const authorizableMock: BoardDoAuthorizable = new BoardDoAuthorizable({
					users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
					id: element.id,
					boardDo: element,
					rootDo: columnBoardFactory.build(),
				});

				boardDoAuthorizableService.findById.mockResolvedValueOnce(authorizableMock);

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
