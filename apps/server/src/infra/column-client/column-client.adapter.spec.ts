import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ColumnClientAdapter } from './column-client.adapter';
import { BoardColumnApi, CreateCardBodyParamsRequiredEmptyElements, CreateCardImportBodyParams } from './generated';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';

describe(ColumnClientAdapter.name, () => {
	let module: TestingModule;
	let sut: ColumnClientAdapter;

	const columnApiMock = createMock<BoardColumnApi>();

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ColumnClientAdapter,
				{
					provide: BoardColumnApi,
					useValue: columnApiMock,
				},
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

				return {
					columnId,
					cardParams,
				};
			};

			it('should call boardColumnApi.ColumnControllerCreateCard', async () => {
				const { columnId, cardParams } = setup();

				const response = await sut.createCard(columnId, cardParams);

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

				return {
					columnId,
					title,
				};
			};

			it('should call boardColumnApi.columnControllerUpdateColumnTitle', async () => {
				const { columnId, title } = setup();

				await sut.updateBoardColumnTitle(columnId, { title });

				expect(columnApiMock.columnControllerUpdateColumnTitle).toHaveBeenCalledWith(columnId, { title });
			});
		});
	});

	describe('createCardWithContent', () => {
		describe('when creating a card with content', () => {
			const setup = () => {
				const columnId = faker.string.uuid();
				
			const testCardImport: CreateCardImportBodyParams = {
			cardTitle: "Sample Card Title",
			cardElements: [
				{
					data: {
						type: "richText",
						content: {
							text: "This is a sample rich text content for testing purposes.",
							inputFormat: "html"
						}
					}
				}
			]
			};


				columnApiMock.columnControllerCreateCardWithContent.mockResolvedValue(axiosResponseFactory.build({ data: columnId }));

				return {
					columnId,
					testCardImport,
				};
			};

			it('should call boardColumnApi.columnControllerCreateCardWithContent', async () => {
				const { columnId, testCardImport } = setup();

				const response = await sut.createCardWithContent(columnId, testCardImport);

				expect(response).toEqual(columnId);
				expect(columnApiMock.columnControllerCreateCardWithContent).toHaveBeenCalledWith(columnId, testCardImport);
			});
		});
	});
});
