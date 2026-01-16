import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardCardApi, BoardElementApi, ContentElementType } from './generated';
import { CardClientAdapter, CardClientConfig } from '.';
import { faker } from '@faker-js/faker/.';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { ConfigModule } from '@nestjs/config';

const cardApiMock = createMock<BoardCardApi>();
jest.mock('./generated/api/board-card-api', () => {
	return {
		BoardCardApi: jest.fn().mockImplementation(() => cardApiMock),
	};
});

const boardElementApiMock = createMock<BoardElementApi>();
jest.mock('./generated/api/board-element-api', () => {
	return {
		BoardElementApi: jest.fn().mockImplementation(() => boardElementApiMock),
	};
});

describe(CardClientAdapter.name, () => {
	let module: TestingModule;
	let sut: CardClientAdapter;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [CardClientAdapter],
			imports: [
				ConfigModule.forRoot({
					isGlobal: true,
					load: [
						(): CardClientConfig => {
							return {
								API_HOST: faker.internet.url(),
							};
						},
					],
				}),
			],
		}).compile();
		sut = module.get(CardClientAdapter);
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
				expect(cardApiMock.cardControllerCreateElement).toHaveBeenCalledWith(cardId, createContentElementBodyParams);
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

				expect(cardApiMock.cardControllerUpdateCardTitle).toHaveBeenCalledWith(cardId, renameBodyParams);
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
					updateElementContentBodyParams
				);
			});
		});
	});
});
