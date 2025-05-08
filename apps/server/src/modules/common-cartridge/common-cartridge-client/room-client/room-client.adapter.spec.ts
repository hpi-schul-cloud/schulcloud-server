import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { REQUEST } from '@nestjs/core';
import { faker } from '@faker-js/faker';
import { Request } from 'express';
import { AxiosResponse } from 'axios';
import { CourseRoomsApi, SingleColumnBoardResponse } from './room-api-client';
import { CourseRoomsClientAdapter } from './room-client.adapter';
import { RoomBoardDtoMapper } from './mapper/room-board-dto.mapper';
import { RoomBoardDto } from './dto';

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
				{
					provide: RoomBoardDtoMapper,
					useValue: createMock<RoomBoardDtoMapper>(),
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

	describe('getRoomBoardByCourseId', () => {
		describe('when getRoomBoardByCourseId is called', () => {
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

				const mappedResponse: RoomBoardDto = {
					roomId: response.data.roomId,
					title: response.data.title,
					displayColor: response.data.displayColor,
					isSynchronized: response.data.isSynchronized,
					elements: [],
					isArchived: false,
				};

				jest.spyOn(RoomBoardDtoMapper, 'mapResponseToRoomBoardDto').mockReturnValueOnce(mappedResponse);

				return { roomId, mappedResponse };
			};

			it('should return a room board with full contents', async () => {
				const { roomId, mappedResponse } = setup();
				const result = await service.getRoomBoardByCourseId(roomId);

				expect(result).toEqual(mappedResponse);
			});
		});
	});

	describe('when no JWT token is found', () => {
		const setup = () => {
			const roomId = faker.string.uuid();
			const error = new Error('No JWT token found');
			const request = createMock<Request>({
				headers: {},
			});
			const adapter: CourseRoomsClientAdapter = new CourseRoomsClientAdapter(courseRoomsApi, request);

			return { roomId, error, adapter };
		};

		it('should throw an UnauthorizedException', async () => {
			const { roomId, error, adapter } = setup();

			await expect(adapter.getRoomBoardByCourseId(roomId)).rejects.toThrowError(error);
		});
	});
});
