import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CoursesClientAdapter } from './courses-client.adapter';
import { CoursesApi, CreateCourseBodyParams } from './generated';

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

			return { courseId };
		};

		it('should call courseControllerGetCourseCcMetadataById with the correct courseId', async () => {
			const { courseId } = setup();

			await sut.getCourseCommonCartridgeMetadata(courseId);

			expect(coursesApiMock.courseControllerGetCourseCcMetadataById).toHaveBeenCalledWith(courseId);
		});
	});

	describe('createCourse', () => {
		const setup = () => {
			const params: CreateCourseBodyParams = {
				name: faker.word.noun(),
			};

			return { params };
		};

		it('should call courseControllerCreateCourse with the correct params', async () => {
			const { params } = setup();

			await sut.createCourse(params);

			expect(coursesApiMock.courseControllerCreateCourse).toHaveBeenCalledWith(params);
		});
	});
});
