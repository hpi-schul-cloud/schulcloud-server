import { faker } from '@faker-js/faker/.';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { AxiosResponse } from 'axios';
import { BoardCardApi, BoardElementApi, CardListResponse, CardResponse, ContentElementType } from '../generated';
import { AdapterUtils } from './adapter.utils';
import { CardClientAdapter } from './card-client.adapter';

describe(CardClientAdapter.name, () => {
	let module: TestingModule;
	let sut: CardClientAdapter;
	let cardApiMock: DeepMocked<BoardCardApi>;
	let boardElementApiMock: DeepMocked<BoardElementApi>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CardClientAdapter,
				{
					provide: BoardCardApi,
					useValue: createMock<BoardCardApi>(),
				},
				{
					provide: BoardElementApi,
					useValue: createMock<BoardElementApi>(),
				},
			],
		}).compile();
		sut = module.get(CardClientAdapter);
		cardApiMock = module.get(BoardCardApi);
		boardElementApiMock = module.get(BoardElementApi);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('getAllBoardCardsByIds', () => {
		describe('when getAllBoardCardsByIds is called', () => {
			const setup = () => {
				const jwt = faker.internet.jwt();
				const cardResponseData: CardResponse[] = [];
				const data: CardListResponse = { data: cardResponseData };
				const response = createMock<AxiosResponse<CardListResponse>>({
					data,
				});

				cardApiMock.cardControllerGetCards.mockResolvedValue(response);

				const id = faker.string.uuid();
				return { id, jwt };
			};

			it('it should return a list of card response', async () => {
				const { id, jwt } = setup();
				const ids: Array<string> = new Array<string>(id);

				await sut.getAllBoardCardsByIds(jwt, ids);
				expect(cardApiMock.cardControllerGetCards).toHaveBeenCalled();
			});
		});
	});

	describe('createCardElement', () => {
		describe('when creating a card element', () => {
			const setup = () => {
				const cardId = faker.string.uuid();
				const createContentElementBodyParams = {
					type: ContentElementType.RICH_TEXT,
					toPosition: 1,
				};

				cardApiMock.cardControllerCreateElement.mockResolvedValue(
					axiosResponseFactory.build({ data: { id: cardId, type: ContentElementType.RICH_TEXT } })
				);

				const jwt = faker.internet.jwt();

				return {
					cardId,
					createContentElementBodyParams,
					jwt,
				};
			};

			it('should call cardApi.cardControllerCreateElement', async () => {
				const { cardId, createContentElementBodyParams, jwt } = setup();

				const response = await sut.createCardElement(jwt, cardId, createContentElementBodyParams);

				expect(response.id).toEqual(cardId);
				expect(response.type).toEqual(ContentElementType.RICH_TEXT);
				expect(cardApiMock.cardControllerCreateElement).toHaveBeenCalledWith(
					cardId,
					createContentElementBodyParams,
					AdapterUtils.createAxiosConfigForJwt(jwt)
				);
			});
		});
	});

	describe('updateCardTitle', () => {
		describe('when updating a card title', () => {
			const setup = () => {
				const cardId = faker.string.uuid();
				const renameBodyParams = {
					title: faker.lorem.words(),
				};
				const jwt = faker.internet.jwt();

				return {
					cardId,
					renameBodyParams,
					jwt,
				};
			};

			it('should call cardApi.cardControllerUpdateCardTitle', async () => {
				const { cardId, renameBodyParams, jwt } = setup();

				await sut.updateCardTitle(jwt, cardId, renameBodyParams);

				expect(cardApiMock.cardControllerUpdateCardTitle).toHaveBeenCalledWith(
					cardId,
					renameBodyParams,
					AdapterUtils.createAxiosConfigForJwt(jwt)
				);
			});
		});
	});

	describe('updateCardElement', () => {
		describe('when updating a card element', () => {
			const setup = () => {
				const elementId = faker.string.uuid();
				const updateElementContentBodyParams = {
					data: {
						type: ContentElementType.RICH_TEXT,
						content: {
							inputFormat: 'richText',
							text: faker.lorem.words(),
						},
					},
				};

				boardElementApiMock.elementControllerUpdateElement.mockResolvedValue(
					axiosResponseFactory.build({ data: updateElementContentBodyParams })
				);

				const jwt = faker.internet.jwt();

				return {
					elementId,
					updateElementContentBodyParams,
					jwt,
				};
			};

			it('should call elementAPI.elementControllerUpdateElement', async () => {
				const { elementId, updateElementContentBodyParams, jwt } = setup();

				const response = await sut.updateCardElement(jwt, elementId, updateElementContentBodyParams);

				expect(response).toEqual(updateElementContentBodyParams);
				expect(boardElementApiMock.elementControllerUpdateElement).toHaveBeenCalledWith(
					elementId,
					updateElementContentBodyParams,
					AdapterUtils.createAxiosConfigForJwt(jwt)
				);
			});
		});
	});
});
