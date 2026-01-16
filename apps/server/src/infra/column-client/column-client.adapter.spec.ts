import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ColumnClientAdapter } from './column-client.adapter';
import { BoardColumnApi, CreateCardBodyParamsRequiredEmptyElements } from './generated';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { ConfigModule } from '@nestjs/config';
import { ColumnClientConfig } from './column-client.config';

const columnApiMock = createMock<BoardColumnApi>();
jest.mock('./generated/api/board-column-api', () => {
	return {
		BoardColumnApi: jest.fn().mockImplementation(() => columnApiMock),
	};
});

describe(ColumnClientAdapter.name, () => {
	let module: TestingModule;
	let sut: ColumnClientAdapter;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [ColumnClientAdapter],
			imports: [
				ConfigModule.forRoot({
					isGlobal: true,
					load: [
						(): ColumnClientConfig => {
							return {
								API_HOST: faker.internet.url(),
							};
						},
					],
				}),
			],
		}).compile();
		sut = module.get(ColumnClientAdapter);
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

	describe('createCard', () => {
		describe('when creating a card', () => {
			const setup = () => {
				const columnId = faker.string.uuid();
				const cardParams = {
					requiredEmptyElements: [CreateCardBodyParamsRequiredEmptyElements.RICH_TEXT],
				};

				columnApiMock.columnControllerCreateCard.mockResolvedValue(axiosResponseFactory.build({ data: columnId }));

				const jwt = faker.internet.jwt();

				return {
					columnId,
					cardParams,
					jwt,
				};
			};

			it('should call boardColumnApi.ColumnControllerCreateCard', async () => {
				const { columnId, cardParams, jwt } = setup();

				const response = await sut.createCard(jwt, columnId, cardParams);

				expect(response).toEqual(columnId);
				expect(columnApiMock.columnControllerCreateCard).toHaveBeenCalledWith(columnId, cardParams);
			});
		});
	});

	describe('updateBoardColumnTitle', () => {
		describe('when updating a board column title', () => {
			const setup = () => {
				const columnId = faker.string.uuid();
				const title = faker.lorem.words();

				const jwt = faker.internet.jwt();

				return {
					columnId,
					title,
					jwt,
				};
			};

			it('should call boardColumnApi.columnControllerUpdateColumnTitle', async () => {
				const { columnId, title, jwt } = setup();

				await sut.updateBoardColumnTitle(jwt, columnId, { title });

				expect(columnApiMock.columnControllerUpdateColumnTitle).toHaveBeenCalledWith(columnId, { title });
			});
		});
	});
});
