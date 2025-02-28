import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizableReferenceType, AuthorizationInjectionService } from '@modules/authorization';
import { courseFactory } from '@modules/course/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { COURSE_REPO, CourseRepo } from '../interface';
import { CourseAuthorizableService } from './course-authorizable.service';

describe(CourseAuthorizableService.name, () => {
	let module: TestingModule;
	let service: CourseAuthorizableService;

	let courseRepo: DeepMocked<CourseRepo>;
	let injectionService: DeepMocked<AuthorizationInjectionService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CourseAuthorizableService,
				{
					provide: COURSE_REPO,
					useValue: createMock<CourseRepo>(),
				},
				AuthorizationInjectionService,
			],
		}).compile();

		service = module.get(CourseAuthorizableService);
		courseRepo = module.get(COURSE_REPO);
		injectionService = module.get(AuthorizationInjectionService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('constructor', () => {
		it('should inject itself into the AuthorizationInjectionService', () => {
			expect(injectionService.getReferenceLoader(AuthorizableReferenceType.Course)).toBe(service);
		});
	});

	describe('findById', () => {
		describe('when id is given', () => {
			const setup = () => {
				const course = courseFactory.build();

				courseRepo.findCourseById.mockResolvedValue(course);

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
