import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { courseFactory } from '@modules/course/testing';
import { GroupService } from '@modules/group';
import { groupFactory } from '@modules/group/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { CourseDoService, CourseSyncService } from '../domain';
import { CourseSyncUc } from './course-sync.uc';

describe(CourseSyncUc.name, () => {
	let module: TestingModule;
	let uc: CourseSyncUc;

	let authorizationService: DeepMocked<AuthorizationService>;
	let courseService: DeepMocked<CourseDoService>;
	let groupService: DeepMocked<GroupService>;
	let courseSyncService: DeepMocked<CourseSyncService>;

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
					provide: CourseSyncService,
					useValue: createMock<CourseSyncService>(),
				},
				{
					provide: GroupService,
					useValue: createMock<GroupService>(),
				},
			],
		}).compile();

		uc = module.get(CourseSyncUc);
		authorizationService = module.get(AuthorizationService);
		courseService = module.get(CourseDoService);
		groupService = module.get(GroupService);
		courseSyncService = module.get(CourseSyncService);

		await setupEntities([User]);
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

				expect(courseSyncService.stopSynchronization).toHaveBeenCalledWith(course);
			});
		});
	});

	describe('startSynchronization', () => {
		describe('when a user starts a synchronization of a course with a group', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.build();
				const group = groupFactory.build();

				courseService.findById.mockResolvedValueOnce(course);
				groupService.findById.mockResolvedValueOnce(group);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					user,
					course,
					group,
				};
			};

			it('should check the users permission', async () => {
				const { user, course, group } = setup();

				await uc.startSynchronization(user.id, course.id, group.id);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					course,
					AuthorizationContextBuilder.write([Permission.COURSE_EDIT])
				);
			});

			it('should call course do service with the correct course id', async () => {
				const { user, course, group } = setup();

				await uc.startSynchronization(user.id, course.id, group.id);
				expect(courseService.findById).toHaveBeenCalledWith(course.id);
			});

			it('should call group service with the correct group id', async () => {
				const { user, course, group } = setup();

				await uc.startSynchronization(user.id, course.id, group.id);

				expect(groupService.findById).toHaveBeenCalledWith(group.id);
			});

			it('should start the synchronization', async () => {
				const { user, course, group } = setup();

				await uc.startSynchronization(user.id, course.id, group.id);

				expect(courseSyncService.startSynchronization).toHaveBeenCalledWith(course, group, user);
			});
		});
	});
});
