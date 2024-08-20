import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { GroupService } from '@modules/group';
import { SchoolService } from '@modules/school';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { groupFactory, setupEntities, userFactory } from '@shared/testing';
import { CourseDoService } from '../service';
import { courseFactory } from '../testing';
import { CourseSyncUc } from './course-sync.uc';
import { schoolFactory } from '../../school/testing';

describe(CourseSyncUc.name, () => {
	let module: TestingModule;
	let uc: CourseSyncUc;

	let authorizationService: DeepMocked<AuthorizationService>;
	let courseService: DeepMocked<CourseDoService>;
	let groupService: DeepMocked<GroupService>;
	let schoolService: DeepMocked<SchoolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CourseSyncUc,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: CourseDoService,
					useValue: createMock<CourseDoService>(),
				},
				{
					provide: GroupService,
					useValue: createMock<GroupService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
			],
		}).compile();

		uc = module.get(CourseSyncUc);
		authorizationService = module.get(AuthorizationService);
		courseService = module.get(CourseDoService);
		groupService = module.get(GroupService);
		schoolService = module.get(SchoolService);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('stopSynchronization', () => {
		describe('when a user stops a synchronization of a course with a group', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.build();

				courseService.findById.mockResolvedValueOnce(course);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					user,
					course,
				};
			};

			it('should check the users permission', async () => {
				const { user, course } = setup();

				await uc.stopSynchronization(user.id, course.id);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					course,
					AuthorizationContextBuilder.write([Permission.COURSE_EDIT])
				);
			});

			it('should stop the synchronization', async () => {
				const { user, course } = setup();

				await uc.stopSynchronization(user.id, course.id);

				expect(courseService.stopSynchronization).toHaveBeenCalledWith(course);
			});
		});
	});

	describe('startSynchronization', () => {
		describe('when a user starts a synchronization of a course with a group', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.build();
				const group = groupFactory.build();
				const school = schoolFactory.build();

				courseService.findById.mockResolvedValueOnce(course);
				groupService.findById.mockResolvedValueOnce(group);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					user,
					course,
					group,
					school,
				};
			};

			it('should check the users permission', async () => {
				const { user, course, group, school } = setup();

				await uc.startSynchronization(user.id, course.id, group.id);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					school,
					AuthorizationContextBuilder.write([Permission.COURSE_EDIT])
				);
			});

			it('should start the synchronization', async () => {
				const { user, course, group } = setup();

				await uc.startSynchronization(user.id, course.id, group.id);

				expect(courseService.startSynchronization).toHaveBeenCalledWith(course, group);
			});
		});
	});
});
