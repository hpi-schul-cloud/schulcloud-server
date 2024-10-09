import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { GroupService } from '@modules/group';
import { RoleService } from '@modules/role';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission, RoleName } from '@shared/domain/interface';
import { groupFactory, roleDtoFactory, setupEntities, userFactory } from '@shared/testing';
import { CourseDoService } from '../service';
import { courseFactory } from '../testing';
import { CourseSyncUc } from './course-sync.uc';

describe(CourseSyncUc.name, () => {
	let module: TestingModule;
	let uc: CourseSyncUc;

	let authorizationService: DeepMocked<AuthorizationService>;
	let courseService: DeepMocked<CourseDoService>;
	let groupService: DeepMocked<GroupService>;
	let roleService: DeepMocked<RoleService>;

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
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
			],
		}).compile();

		uc = module.get(CourseSyncUc);
		authorizationService = module.get(AuthorizationService);
		courseService = module.get(CourseDoService);
		groupService = module.get(GroupService);
		roleService = module.get(RoleService);
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
				const studentRole = roleDtoFactory.build({ id: 'student-role-id' });
				const teacherRole = roleDtoFactory.build({ id: 'teacher-role-id' });

				group.users = [
					{ roleId: 'student-role-id', userId: 'student-user-id' },
					{ roleId: 'teacher-role-id', userId: 'teacher-user-id' },
				];

				const students = group.users.filter((groupUser) => groupUser.roleId === studentRole.id);
				const teachers = group.users.filter((groupUser) => groupUser.roleId === teacherRole.id);

				courseService.findById.mockResolvedValueOnce(course);
				groupService.findById.mockResolvedValueOnce(group);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				roleService.findByName.mockResolvedValueOnce(studentRole).mockResolvedValueOnce(teacherRole);

				return {
					user,
					course,
					group,
					studentRole,
					teacherRole,
					students,
					teachers,
				};
			};

			it('should check the users permission', async () => {
				const { user, course, group } = setup();

				await uc.startSynchronization(user.id, course.id, group.id);

				expect(courseService.findById).toHaveBeenCalledWith(course.id);
				expect(groupService.findById).toHaveBeenCalledWith(group.id);
				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					course,
					AuthorizationContextBuilder.write([Permission.COURSE_EDIT])
				);
			});

			it('should start the synchronization with correct roles', async () => {
				const { user, course, group, students, teachers } = setup();

				await uc.startSynchronization(user.id, course.id, group.id);

				expect(courseService.findById).toHaveBeenCalledWith(course.id);
				expect(groupService.findById).toHaveBeenCalledWith(group.id);

				expect(roleService.findByName).toHaveBeenCalledWith(RoleName.STUDENT);
				expect(roleService.findByName).toHaveBeenCalledWith(RoleName.TEACHER);

				expect(courseService.startSynchronization).toHaveBeenCalledWith(course, group, students, teachers);
			});
		});
	});
});
