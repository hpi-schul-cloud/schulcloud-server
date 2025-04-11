import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { faker } from '@faker-js/faker';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { BoardsClientAdapter } from './boards-client.adapter';
import { BoardApi, BoardColumnApi, BoardResponse, CreateBoardBodyParams, CreateBoardResponse } from './generated';

describe(BoardsClientAdapter.name, () => {
	let module: TestingModule;
	let sut: BoardsClientAdapter;

	const boardApiMock = createMock<BoardApi>();
	const boardColumnApiMock = createMock<BoardColumnApi>();

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardsClientAdapter,
				{
					provide: BoardApi,
					useValue: boardApiMock,
				},
				{
					provide: BoardColumnApi,
					useValue: boardColumnApiMock,
				},
			],
		}).compile();
		sut = module.get(BoardsClientAdapter);
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

	describe('createBoard', () => {
		describe('when creating a board', () => {
			const setup = () => {
				const params: CreateBoardBodyParams = {
					title: faker.lorem.words(),
					layout: 'columns',
					parentId: faker.string.uuid(),
					parentType: 'course',
				};
				const responseData: CreateBoardResponse = {
					id: faker.string.uuid(),
				};

				boardApiMock.boardControllerCreateBoard.mockResolvedValue(axiosResponseFactory.build({ data: responseData }));

				return {
					params,
					responseData,
				};
			};

			it('should call boardApi.boardControllerCreateBoard', async () => {
				const { params, responseData } = setup();

				const response = await sut.createBoard(params);

				expect(response).toEqual(responseData);
				expect(boardApiMock.boardControllerCreateBoard).toHaveBeenCalledWith(params);
			});
		});
	});

	describe('getBoardSkeletonById', () => {
		describe('when reading a board', () => {
			const setup = () => {
				const boardId = faker.string.uuid();
				const responseData: BoardResponse = {
					id: boardId,
					title: faker.lorem.words(),
					layout: 'columns',
					columns: [],
					isVisible: true,
					features: [],
					timestamps: {
						createdAt: faker.date.recent().toISOString(),
						lastUpdatedAt: faker.date.recent().toISOString(),
					},
				};

				boardApiMock.boardControllerGetBoardSkeleton.mockResolvedValue(
					axiosResponseFactory.build({ data: responseData })
				);

				return {
					boardId,
					responseData,
				};
			};

			it('should call boardApi.boardControllerGetBoardSkeleton', async () => {
				const { boardId, responseData } = setup();

				const response = await sut.getBoardSkeletonById(boardId);

				expect(response).toEqual(responseData);
				expect(boardApiMock.boardControllerGetBoardSkeleton).toHaveBeenCalledWith(boardId);
			});
		});
	});

	describe('createBoardColumn', () => {
		describe('when creating a board column', () => {
			const setup = () => {
				const boardId = faker.string.uuid();
				const responseData: CreateBoardResponse = {
					id: faker.string.uuid(),
				};

				boardApiMock.boardControllerCreateColumn.mockResolvedValue(axiosResponseFactory.build({ data: responseData }));

				return {
					boardId,
					responseData,
				};
			};

			it('should call boardApi.boardControllerCreateColumn', async () => {
				const { boardId, responseData } = setup();

				const response = await sut.createBoardColumn(boardId);

				expect(response).toEqual(responseData);
				expect(boardApiMock.boardControllerCreateColumn).toHaveBeenCalledWith(boardId);
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

				expect(boardColumnApiMock.columnControllerUpdateColumnTitle).toHaveBeenCalledWith(columnId, { title });
			});
		});
	});
});
