import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@infra/logger';
import { UserLoginMigrationEntity } from '@modules/user-login-migration/repo';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, type TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { CourseEntity, CourseGroupEntity, CourseGroupRepo } from '../../repo';
import { courseGroupEntityFactory } from '../../testing';
import { CourseGroupService } from './coursegroup.service';

describe('CourseGroupService', () => {
	let module: TestingModule;
	let courseGroupRepo: DeepMocked<CourseGroupRepo>;
	let courseGroupService: CourseGroupService;

	beforeAll(async () => {
		await setupEntities([User, CourseEntity, CourseGroupEntity, UserLoginMigrationEntity]);
		module = await Test.createTestingModule({
			providers: [
				CourseGroupService,
				{
					provide: CourseGroupRepo,
					useValue: createMock<CourseGroupRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();
		courseGroupRepo = module.get(CourseGroupRepo);
		courseGroupService = module.get(CourseGroupService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('findAllCourseGroupsByUserId', () => {
		describe('when finding by userId', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const courseGroups = courseGroupEntityFactory.buildListWithId(2, { students: [user] });

				courseGroupRepo.findByUserId.mockResolvedValue([courseGroups, courseGroups.length]);

				return {
					user,
					courseGroups,
				};
			};

			it('should call courseGroupRepo.findByUserId', async () => {
				const { user } = setup();

				await courseGroupService.findAllCourseGroupsByUserId(user.id);

				expect(courseGroupRepo.findByUserId).toHaveBeenCalledWith(user.id);
			});

			it('should return array with coursesGroup with userId', async () => {
				const { user, courseGroups } = setup();

				const [courseGroup] = await courseGroupService.findAllCourseGroupsByUserId(user.id);

				expect(courseGroup.length).toEqual(2);
				expect(courseGroup).toEqual(courseGroups);
			});
		});
	});
});
