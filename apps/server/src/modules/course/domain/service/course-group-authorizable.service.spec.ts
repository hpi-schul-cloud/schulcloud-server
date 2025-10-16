import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizableReferenceType, AuthorizationInjectionService } from '@modules/authorization';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { CourseEntity, CourseGroupEntity, CourseGroupRepo } from '../../repo';
import { courseGroupEntityFactory } from '../../testing';
import { CourseGroupAuthorizableService } from './course-group-authorizable.service';

describe(CourseGroupAuthorizableService.name, () => {
	let module: TestingModule;
	let service: CourseGroupAuthorizableService;

	let courseGroupRepo: DeepMocked<CourseGroupRepo>;
	let injectionService: AuthorizationInjectionService;

	beforeAll(async () => {
		await setupEntities([CourseEntity, CourseGroupEntity]);
		module = await Test.createTestingModule({
			providers: [
				CourseGroupAuthorizableService,
				{
					provide: CourseGroupRepo,
					useValue: createMock<CourseGroupRepo>(),
				},
				AuthorizationInjectionService,
			],
		}).compile();

		service = module.get(CourseGroupAuthorizableService);
		courseGroupRepo = module.get(CourseGroupRepo);
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
			expect(injectionService.getReferenceLoader(AuthorizableReferenceType.CourseGroup)).toBe(service);
		});
	});

	describe('findById', () => {
		describe('when id is given', () => {
			const setup = () => {
				const courseGroup = courseGroupEntityFactory.build();

				courseGroupRepo.findById.mockResolvedValue(courseGroup);

				return {
					courseGroup,
				};
			};

			it('should return a contextExternalTool', async () => {
				const { courseGroup } = setup();

				const result = await service.findById(courseGroup.id);

				expect(result).toEqual(courseGroup);
			});
		});
	});
});
