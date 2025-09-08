import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizableReferenceType, AuthorizationInjectionService } from '@modules/authorization';
import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory } from '../../testing';
import { COURSE_REPO, CourseRepo } from '../interface';
import { CourseAuthorizableService } from './course-authorizable.service';

describe(CourseAuthorizableService.name, () => {
	let module: TestingModule;
	let service: CourseAuthorizableService;

	let courseRepo: DeepMocked<CourseRepo>;
	let injectionService: AuthorizationInjectionService;

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

			it('should call courseRepo.findCourseById with correctly props', async () => {
				const { course } = setup();

				await service.findById(course.id);

				expect(courseRepo.findCourseById).toBeCalledWith(course.id);
			});

			it('should return a course', async () => {
				const { course } = setup();

				const result = await service.findById(course.id);

				expect(result).toEqual(course);
			});
		});
	});
});
