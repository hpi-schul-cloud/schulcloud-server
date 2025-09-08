import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';
import { CardListResponse, CardResponse } from './cards-api-client/models';
import { CardClientAdapter } from './card-client.adapter';
import { BoardCardApi } from './cards-api-client';

describe(CardClientAdapter.name, () => {
	const jwtToken = faker.string.alphanumeric(20);
	let module: TestingModule;
	let adapterUnderTest: CardClientAdapter;
	let cardApiMock: DeepMocked<BoardCardApi>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CardClientAdapter,
				{
					provide: BoardCardApi,
					useValue: createMock<BoardCardApi>(),
				},
				{
					provide: REQUEST,
					useValue: createMock<Request>({
						headers: {
							authorization: `Bearer ${jwtToken}`,
						},
					}),
				},
			],
		}).compile();
		adapterUnderTest = module.get(CardClientAdapter);
		cardApiMock = module.get(BoardCardApi);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('CardClientAdapter should be defind', () => {
		expect(adapterUnderTest).toBeDefined();
	});

	describe('getAllBoardCardsByIds', () => {
		describe('when getAllBoardCardsByIds is called', () => {
			const setup = () => {
				const cardResponseData: CardResponse[] = [];
				const data: CardListResponse = { data: cardResponseData };
				const response = createMock<AxiosResponse<CardListResponse>>({
					data,
				});

				cardApiMock.cardControllerGetCards.mockResolvedValue(response);

				return faker.string.uuid();
			};

			it('it should return a list of card response', async () => {
				const ids: Array<string> = new Array<string>(setup());
				await adapterUnderTest.getAllBoardCardsByIds(ids);
				expect(cardApiMock.cardControllerGetCards).toHaveBeenCalled();
			});
		});
	});

	describe('When no JWT token is found', () => {
		const setup = () => {
			const ids: Array<string> = new Array<string>(faker.string.uuid());
			const request = createMock<Request>({
				headers: {},
			});

			const adapter: CardClientAdapter = new CardClientAdapter(cardApiMock, request);

			return { ids, adapter };
		};

		it('should throw an UnauthorizedError', async () => {
			const { ids, adapter } = setup();

			await expect(adapter.getAllBoardCardsByIds(ids)).rejects.toThrowError(UnauthorizedException);
		});
	});
});
