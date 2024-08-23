import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { faker } from '@faker-js/faker';
import { AxiosResponse } from 'axios';
import { CoursesClientAdapter } from './courses-client.adapter';
import { CourseCommonCartridgeMetadataResponse, CoursesApi } from './courses-api-client';

const jwtToken = 'dummyJwtToken';

describe(CoursesClientAdapter.name, () => {
	let module: TestingModule;
	let service: CoursesClientAdapter;
	let coursesApi: DeepMocked<CoursesApi>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CoursesClientAdapter,
				{
					provide: CoursesApi,
					useValue: createMock<CoursesApi>(),
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

		service = module.get(CoursesClientAdapter);
		coursesApi = module.get(CoursesApi);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('getCourseCommonCartridgeMetadata', () => {
		describe('when getCourseCommonCartridgeMetadata is called', () => {
			const setup = () => {
				const courseId = faker.string.uuid();
				const response = createMock<AxiosResponse<CourseCommonCartridgeMetadataResponse>>({
					data: {
						id: faker.string.uuid(),
						title: faker.lorem.word(),
						creationDate: faker.date.recent().toString(),
						copyRightOwners: [faker.lorem.word(), faker.lorem.word()],
					},
				});

				coursesApi.courseControllerGetCourseCcMetadataById.mockResolvedValueOnce(response);
				return { courseId };
			};
			it('should return course common cartridge metadata', async () => {
				const { courseId } = setup();

				const expectedOptions = { headers: { authorization: `Bearer ${jwtToken}` } };

				const result = await service.getCourseCommonCartridgeMetadata(courseId);

				expect(coursesApi.courseControllerGetCourseCcMetadataById).toHaveBeenCalledWith(courseId, expectedOptions);
				expect(result.id).toBeDefined();
				expect(result.title).toBeDefined();
				expect(result.creationDate).toBeDefined();
				expect(result.copyRightOwners).toBeDefined();
			});
		});
	});

	describe('when no JWT token is found', () => {
		const setup = () => {
			const courseId = faker.string.uuid();
			const error = new Error('Authentication is required.');
			const request = createMock<Request>({
				headers: {},
			});

			const adapter: CoursesClientAdapter = new CoursesClientAdapter(coursesApi, request);

			return { error, courseId, adapter };
		};

		it('should throw an Error', async () => {
			const { error, courseId, adapter } = setup();

			await expect(adapter.getCourseCommonCartridgeMetadata(courseId)).rejects.toThrowError(error);
		});
	});
});
