import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { REQUEST } from '@nestjs/core';
import { faker } from '@faker-js/faker';
import { Request } from 'express';
import { AxiosResponse } from 'axios';
import { CourseRoomsApi, SingleColumnBoardResponse } from './room-api-client';
import { CourseRoomsClientAdapter } from './room-client.adapter';

const jwtToken = 'dummyJwtToken';

describe(CourseRoomsClientAdapter.name, () => {
	let module: TestingModule;
	let service: CourseRoomsClientAdapter;
	let courseRoomsApi: DeepMocked<CourseRoomsApi>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CourseRoomsClientAdapter,
				{
					provide: CourseRoomsApi,
					useValue: createMock<CourseRoomsApi>(),
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

		service = module.get(CourseRoomsClientAdapter);
		courseRoomsApi = module.get(CourseRoomsApi);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('getCourseRoomBoard', () => {
		describe('when getCourseRoomBoard is called', () => {
			const setup = () => {
				const roomId = faker.string.uuid();
				const response = createMock<AxiosResponse<SingleColumnBoardResponse>>({
					data: {
						roomId: faker.string.uuid(),
						title: faker.lorem.word(),
						displayColor: faker.date.recent().toString(),
						isSynchronized: faker.datatype.boolean(),
					},
				});

				courseRoomsApi.courseRoomsControllerGetRoomBoard.mockResolvedValueOnce(response);

				return { roomId, response };
			};

			it('should return the structure of the course', async () => {
				const { roomId, response } = setup();
				const result = await service.getCourseRoomBoard(roomId);

				expect(result).toEqual(response.data);
			});
		});
	});

	describe('when no JWT token is found', () => {
		const setup = () => {
			const roomId = faker.string.uuid();
			const error = new Error('Authentication is required.');
			const request = createMock<Request>({
				headers: {},
			});
			const adapter: CourseRoomsClientAdapter = new CourseRoomsClientAdapter(courseRoomsApi, request);

			return { roomId, error, adapter };
		};

		it('should throw an UnauthorizedException', async () => {
			const { roomId, error, adapter } = setup();

			await expect(adapter.getCourseRoomBoard(roomId)).rejects.toThrowError(error);
		});
	});
});
