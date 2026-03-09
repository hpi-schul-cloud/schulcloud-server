import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CoursesApi, CreateCourseBodyParams } from '../generated';
import { AdapterUtils } from './adapter.utils';
import { CoursesClientAdapter } from './courses-client.adapter';

describe(CoursesClientAdapter.name, () => {
	let module: TestingModule;
	let sut: CoursesClientAdapter;
	let coursesApiMock: DeepMocked<CoursesApi>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CoursesClientAdapter,
				{
					provide: CoursesApi,
					useValue: createMock<CoursesApi>(),
				},
			],
		}).compile();

		sut = module.get(CoursesClientAdapter);
		coursesApiMock = module.get(CoursesApi);
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

	describe('getCourseCommonCartridgeMetadata', () => {
		const setup = () => {
			const courseId = faker.string.uuid();
			const jwt = faker.internet.jwt();

			return { courseId, jwt };
		};

		it('should call courseControllerGetCourseCcMetadataById with the correct courseId', async () => {
			const { courseId, jwt } = setup();

			await sut.getCourseCommonCartridgeMetadata(jwt, courseId);

			expect(coursesApiMock.courseControllerGetCourseCcMetadataById).toHaveBeenCalledWith(
				courseId,
				AdapterUtils.createAxiosConfigForJwt(jwt)
			);
		});
	});

	describe('createCourse', () => {
		const setup = () => {
			const params: CreateCourseBodyParams = {
				name: faker.word.noun(),
			};
			const jwt = faker.internet.jwt();

			return { params, jwt };
		};

		it('should call courseControllerCreateCourse with the correct params', async () => {
			const { params, jwt } = setup();

			await sut.createCourse(jwt, params);

			expect(coursesApiMock.courseControllerCreateCourse).toHaveBeenCalledWith(
				params,
				AdapterUtils.createAxiosConfigForJwt(jwt)
			);
		});
	});
});
