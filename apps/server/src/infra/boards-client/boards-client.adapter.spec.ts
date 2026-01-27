import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { BoardsClientAdapter } from './boards-client.adapter';
import { BoardApi, BoardResponse, CreateBoardBodyParams, CreateBoardResponse } from './generated';

describe(BoardsClientAdapter.name, () => {
	let module: TestingModule;
	let sut: BoardsClientAdapter;
	let boardApiMock: DeepMocked<BoardApi>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardsClientAdapter,
				{
					provide: BoardApi,
					useValue: createMock<BoardApi>(),
				},
			],
		}).compile();
		sut = module.get(BoardsClientAdapter);
		boardApiMock = module.get(BoardApi);
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

				const jwt = faker.internet.jwt();

				return {
					params,
					responseData,
					jwt,
				};
			};

			it('should call boardApi.boardControllerCreateBoard', async () => {
				const { params, responseData, jwt } = setup();

				const response = await sut.createBoard(jwt, params);

				expect(response).toEqual(responseData);
				expect(boardApiMock.boardControllerCreateBoard).toHaveBeenCalledWith(params, {
					headers: {
						Authorization: `Bearer ${jwt}`,
					},
				});
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

				const jwt = faker.internet.jwt();

				return {
					boardId,
					responseData,
					jwt,
				};
			};

			it('should call boardApi.boardControllerGetBoardSkeleton', async () => {
				const { boardId, responseData, jwt } = setup();

				const response = await sut.getBoardSkeletonById(jwt, boardId);

				expect(response).toEqual(responseData);
				expect(boardApiMock.boardControllerGetBoardSkeleton).toHaveBeenCalledWith(boardId, {
					headers: {
						Authorization: `Bearer ${jwt}`,
					},
				});
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

				const jwt = faker.internet.jwt();

				return {
					boardId,
					responseData,
					jwt,
				};
			};

			it('should call boardApi.boardControllerCreateColumn', async () => {
				const { boardId, responseData, jwt } = setup();

				const response = await sut.createBoardColumn(jwt, boardId);

				expect(response).toEqual(responseData);
				expect(boardApiMock.boardControllerCreateColumn).toHaveBeenCalledWith(boardId, {
					headers: {
						Authorization: `Bearer ${jwt}`,
					},
				});
			});
		});
	});
});
