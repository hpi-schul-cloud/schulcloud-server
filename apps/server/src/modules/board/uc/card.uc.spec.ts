import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardDoAuthorizable, BoardRoles, ContentElementType, UserRoleEnum } from '@shared/domain';
import { axiosResponseFactory, drawingElementFactory, setupEntities, userFactory } from '@shared/testing';
import { cardFactory, richTextElementFactory } from '@shared/testing/factory/domainobject';
import { LegacyLogger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { ObjectId } from 'bson';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { BoardDoAuthorizableService, ContentElementService } from '../service';
import { CardService } from '../service/card.service';
import { CardUc } from './card.uc';

describe(CardUc.name, () => {
	let module: TestingModule;
	let uc: CardUc;
	let authorizationService: DeepMocked<AuthorizationService>;
	let boardDoAuthorizableService: DeepMocked<BoardDoAuthorizableService>;
	let cardService: DeepMocked<CardService>;
	let elementService: DeepMocked<ContentElementService>;
	let httpService: DeepMocked<HttpService>;

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
		httpService = module.get(HttpService);
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
					new BoardDoAuthorizable({ users: [], id: new ObjectId().toHexString() })
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

	describe('createElement', () => {
		describe('when creating a content element', () => {
			const setup = () => {
				const user = userFactory.build();
				const card = cardFactory.build();
				const element = richTextElementFactory.build();

				cardService.findById.mockResolvedValueOnce(card);
				elementService.create.mockResolvedValueOnce(element);

				boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValue(
					new BoardDoAuthorizable({ users: [], id: new ObjectId().toHexString() })
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

	describe('deleteElement', () => {
		describe('when deleting a content element', () => {
			const setup = () => {
				const user = userFactory.build();
				const element = richTextElementFactory.build();
				const drawing = drawingElementFactory.build();
				const card = cardFactory.build();

				boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValue(
					new BoardDoAuthorizable({ users: [], id: new ObjectId().toHexString() })
				);

				return { user, card, element, drawing };
			};

			it('should call the service to find the element', async () => {
				const { user, element } = setup();

				await uc.deleteElement(user.id, element.id, 'auth');

				expect(elementService.findById).toHaveBeenCalledWith(element.id);
			});

			it('should call the service to delete the element', async () => {
				const { user, element } = setup();
				elementService.findById.mockResolvedValueOnce(element);

				await uc.deleteElement(user.id, element.id, 'auth');

				expect(elementService.delete).toHaveBeenCalledWith(element);
			});

			it('should call external controller via delete method to clear drawing bin data', async () => {
				const { user, drawing } = setup();
				elementService.findById.mockResolvedValueOnce(drawing);

				const axiosResponse = axiosResponseFactory.build({
					status: 204,
				});

				httpService.delete.mockReturnValue(of(axiosResponse));

				await uc.deleteElement(user.id, drawing.id, 'auth');

				expect(httpService.delete).toHaveBeenCalled();
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
					users: [{ userId: user.id, roles: [BoardRoles.EDITOR], userRoleEnum: UserRoleEnum.TEACHER }],
					id: element.id,
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
