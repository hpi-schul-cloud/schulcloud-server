import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { GroupService } from '@modules/group';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { groupFactory, setupEntities, userFactory } from '@shared/testing';
import { CourseDoService } from '../service';
import { CourseSyncService } from '../service/course-sync.service';
import { courseFactory } from '../testing';
import { CourseSyncUc } from './course-sync.uc';
import { SyncAttribute } from '../../../shared/domain/entity';

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

				await uc.startSynchronization(user.id, course.id, group.id, []);

				expect(courseSyncService.startSynchronization).toHaveBeenCalledWith(course, group, []);
			});

			it('should start the synchronization', async () => {
				const { user, course, group } = setup();

				await uc.startSynchronization(user.id, course.id, group.id);

				expect(courseSyncService.startSynchronization).toHaveBeenCalledWith(course, group, undefined);
			});
			it('should start partial synchronization', async () => {
				const { user, course, group } = setup();

				await uc.startSynchronization(user.id, course.id, group.id, [SyncAttribute.TEACHERS]);

				expect(courseSyncService.startSynchronization).toHaveBeenCalledWith(course, group, [SyncAttribute.TEACHERS]);
			});
		});
	});
});
