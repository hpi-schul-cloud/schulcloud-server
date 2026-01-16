import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CoursesClientAdapter } from './courses-client.adapter';
import { CoursesApi, CreateCourseBodyParams } from './generated';
import { CoursesClientConfig } from './courses-client.config';
import { ConfigModule } from '@nestjs/config';

const coursesApiMock = createMock<CoursesApi>();
jest.mock('./generated/api/courses-api', () => {
	return {
		CoursesApi: jest.fn().mockImplementation(() => coursesApiMock),
	};
});

describe(CoursesClientAdapter.name, () => {
	let module: TestingModule;
	let sut: CoursesClientAdapter;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [CoursesClientAdapter],
			imports: [
				ConfigModule.forRoot({
					isGlobal: true,
					load: [
						(): CoursesClientConfig => {
							return {
								API_HOST: faker.internet.url(),
							};
						},
					],
				}),
			],
		}).compile();

		sut = module.get(CoursesClientAdapter);
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

			expect(coursesApiMock.courseControllerGetCourseCcMetadataById).toHaveBeenCalledWith(courseId);
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

			expect(coursesApiMock.courseControllerCreateCourse).toHaveBeenCalledWith(params);
		});
	});
});
