import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { faker } from '@faker-js/faker';
import { AxiosResponse } from 'axios';
import { CourseRoomsClientAdapter } from './room-client.adapter';
import { CourseRoomsApi, SingleColumnBoardResponse } from '../generated';

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
				const jwt = faker.internet.jwt();
				const roomId = faker.string.uuid();
				const response = createMock<AxiosResponse<SingleColumnBoardResponse>>({
					data: {
						roomId: faker.string.uuid(),
						title: faker.lorem.word(),
						displayColor: faker.date.recent().toString(),
						isSynchronized: faker.datatype.boolean(),
					},
				});

				return { roomId, response, jwt };
			};

			it('should call courseRoomsControllerGetRoomBoard', async () => {
				const { roomId, response, jwt } = setup();
				const result = await service.getRoomBoardByCourseId(jwt, roomId);

				expect(courseRoomsApi.courseRoomsControllerGetRoomBoard).toHaveBeenCalledWith(roomId);
				expect(result).toEqual(response);
			});
		});
	});
});
