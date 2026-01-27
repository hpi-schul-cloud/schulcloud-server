import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { ColumnClientAdapter } from './column-client.adapter';
import { BoardColumnApi, CreateCardBodyParamsRequiredEmptyElements } from './generated';

describe(ColumnClientAdapter.name, () => {
	let module: TestingModule;
	let sut: ColumnClientAdapter;
	let columnApiMock: DeepMocked<BoardColumnApi>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ColumnClientAdapter,
				{
					provide: BoardColumnApi,
					useValue: createMock<BoardColumnApi>(),
				},
			],
		}).compile();
		sut = module.get(ColumnClientAdapter);
		columnApiMock = module.get(BoardColumnApi);
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
				expect(columnApiMock.columnControllerCreateCard).toHaveBeenCalledWith(columnId, cardParams, {
					headers: {
						Authorization: `Bearer ${jwt}`,
					},
				});
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

				expect(columnApiMock.columnControllerUpdateColumnTitle).toHaveBeenCalledWith(
					columnId,
					{ title },
					{
						headers: {
							Authorization: `Bearer ${jwt}`,
						},
					}
				);
			});
		});
	});
});
