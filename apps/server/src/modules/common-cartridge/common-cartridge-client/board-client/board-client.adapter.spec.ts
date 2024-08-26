import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { Request } from 'express';
import { BoardApi, BoardResponse } from './board-api-client';
import { BoardClientAdapter } from './board-client.adapter';

const jwtToken = 'someJwtToken';

describe(BoardClientAdapter.name, () => {
	let module: TestingModule;
	let sut: BoardClientAdapter;
	let boardApiMock: DeepMocked<BoardApi>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardClientAdapter,
				{
					provide: BoardApi,
					useValue: createMock<BoardApi>(),
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

		sut = module.get(BoardClientAdapter);
		boardApiMock = module.get(BoardApi);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('getBoardSkeletonById', () => {
		describe('When getBoardSkeletonById is called', () => {
			const setup = () => {
				const response = createMock<AxiosResponse<BoardResponse>>({
					data: {
						id: faker.string.uuid(),
						title: faker.lorem.sentence(),
						columns: [],
						isVisible: true,
						layout: 'layout',
						timestamps: {
							createdAt: faker.date.past().toString(),
							lastUpdatedAt: faker.date.recent().toString(),
						},
					},
				});

				boardApiMock.boardControllerGetBoardSkeleton.mockResolvedValue(response);

				return { boardId: response.data.id };
			};

			it('it should return a board skeleton dto', async () => {
				const { boardId } = setup();

				await sut.getBoardSkeletonById(boardId);

				expect(boardApiMock.boardControllerGetBoardSkeleton).toHaveBeenCalled();
			});
		});

		describe('When no JWT token is found', () => {
			const setup = () => {
				const boardId = faker.string.uuid();
				const request = createMock<Request>({
					headers: {},
				});

				const adapter: BoardClientAdapter = new BoardClientAdapter(boardApiMock, request);

				return { boardId, adapter };
			};

			it('should throw an UnauthorizedError', async () => {
				const { boardId, adapter } = setup();

				await expect(adapter.getBoardSkeletonById(boardId)).rejects.toThrowError(UnauthorizedException);
			});
		});
	});
});
