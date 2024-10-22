import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { Request } from 'express';
import { CardListResponse, CardResponse } from './cards-api-client/models';
import { CardClientAdapter } from './card-client.adapter';
import { BoardCardApi } from './cards-api-client';

const jwtToken = 'someJwtToken';

describe(CardClientAdapter.name, () => {
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

	it('CardClientAdapter Properly Defined', () => {
		expect(adapterUnderTest).toBeDefined();
	});

	describe('getAllBoardCardsByIds', () => {
		const setup = () => {
			const cardResponseData: CardResponse[] = [];
			const data: CardListResponse = { data: cardResponseData };
			const response = createMock<AxiosResponse<CardListResponse>>({
				data,
			});

			cardApiMock.cardControllerGetCards.mockResolvedValue(response);

			return { response };
		};
	});
});
