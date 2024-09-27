import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizableReferenceType, AuthorizationInjectionService } from '@src/modules/authorization';
import { CourseReferenceLoader } from './course.reference-loader';
import { CourseDoService } from '@src/modules/learnroom';
import { courseFactory } from '@src/modules/learnroom/testing';

describe('Course Reference Loader', () => {
	let module: TestingModule;
	let service: CourseReferenceLoader;

	let courseDoService: DeepMocked<CourseDoService>;
	let injectionService: DeepMocked<AuthorizationInjectionService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CourseReferenceLoader,
				{
					provide: CourseDoService,
					useValue: createMock<CourseDoService>(),
				},
				{
					provide: AuthorizationInjectionService,
					useValue: createMock<AuthorizationInjectionService>(),
				},
			],
		}).compile();

		service = module.get(CourseReferenceLoader);
		courseDoService = module.get(CourseDoService);
		injectionService = module.get(AuthorizationInjectionService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('constructor', () => {
		it('should inject itself into the AuthorizationInjectionService', () => {
			expect(injectionService.injectReferenceLoader).toHaveBeenCalledWith(AuthorizableReferenceType.Course, service);
		});
	});

	describe('findById', () => {
		describe('when id is given', () => {
			const setup = () => {
				const course = courseFactory.buildWithId();
				courseDoService.findById.mockResolvedValue(course);

				return {
					course,
				};
			};

			it('should return a contextExternalTool', async () => {
				const { course } = setup();

				const result = await service.findById(course.id);

				expect(result).toEqual(course);
			});
		});
	});
});
