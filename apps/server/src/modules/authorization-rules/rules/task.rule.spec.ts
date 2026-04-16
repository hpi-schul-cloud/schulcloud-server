import { DeepPartial } from '@mikro-orm/core';
import {
	Action,
	AUTHORIZATION_CONFIG_TOKEN,
	AuthorizationHelper,
	AuthorizationInjectionService,
} from '@modules/authorization';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { lessonFactory } from '@modules/lesson/testing';
import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { Submission, Task } from '@modules/task/repo';
import { taskFactory } from '@modules/task/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { CourseGroupRule } from './course-group.rule';
import { CourseRule } from './course.rule';
import { LessonRule } from './lesson.rule';
import { TaskRule } from './task.rule';

describe('TaskRule', () => {
	let service: TaskRule;
	let authorizationHelper: AuthorizationHelper;
	let courseRule: DeepPartial<CourseRule>;
	let lessonRule: DeepPartial<LessonRule>;
	let injectionService: AuthorizationInjectionService;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		await setupEntities([User, CourseEntity, CourseGroupEntity, Task, LessonEntity, Material, Submission]);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthorizationHelper,
				TaskRule,
				CourseRule,
				LessonRule,
				CourseGroupRule,
				AuthorizationInjectionService,
				{ provide: AUTHORIZATION_CONFIG_TOKEN, useValue: {} },
			],
		}).compile();

		service = await module.get(TaskRule);
		authorizationHelper = await module.get(AuthorizationHelper);
		courseRule = await module.get(CourseRule);
		lessonRule = await module.get(LessonRule);
		injectionService = await module.get(AuthorizationInjectionService);
	});

	describe('constructor', () => {
		it('should inject into AuthorizationInjectionService', () => {
			expect(injectionService.getAuthorizationRules()).toContain(service);
		});
	});

	describe('[method] hasPermission', () => {
		describe('when user with permission A,B and empty task', () => {
			const setup = () => {
				const role = roleFactory.build({ permissions: [permissionA, permissionB] });
				const user = userFactory.build({ roles: [role] });
				const task = taskFactory.build();

				return { role, user, task };
			};

			it('should return "false" if user has not access to task', () => {
				const { user, task } = setup();
				const res = service.hasPermission(user, task, { action: Action.read, requiredPermissions: [permissionC] });
				expect(res).toBe(false);
			});
		});
		describe('when user is task creator with some permission granted', () => {
			const setup = () => {
				const role = roleFactory.build({ permissions: [permissionA, permissionB] });
				const user = userFactory.build({ roles: [role] });
				const task = taskFactory.build({ creator: user });

				return { role, user, task };
			};

			it('should call baseRule.hasAllPermissions on AuthorizationHelper', () => {
				const { user, task } = setup();
				const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');
				service.hasPermission(user, task, { action: Action.read, requiredPermissions: [] });
				expect(spy).toBeCalledWith(user, []);
			});

			it('should call baseRule.hasAccessToEntity on AuthorizationHelper', () => {
				const { user, task } = setup();
				const spy = jest.spyOn(authorizationHelper, 'hasAccessToEntity');
				service.hasPermission(user, task, { action: Action.read, requiredPermissions: [] });
				expect(spy).toBeCalledWith(user, task, ['creator']);
			});

			it('should return "true" if user has all required permissions', () => {
				const { task, user } = setup();
				const res = service.hasPermission(user, task, { action: Action.read, requiredPermissions: [] });
				expect(res).toBe(true);
			});

			it('should return "false" when user does not have all required permissions', () => {
				const { user, task } = setup();
				const res = service.hasPermission(user, task, { action: Action.read, requiredPermissions: [permissionC] });
				expect(res).toBe(false);
			});
		});

		describe('when user is teacher of course and course has task with permission A,B but not C', () => {
			const setup = () => {
				const role = roleFactory.build({ permissions: [permissionA, permissionB], name: RoleName.TEACHER });
				const user = userFactory.build({ roles: [role] });
				const course = courseEntityFactory.build({ teachers: [user] });
				const task = taskFactory.build({ course });

				return { role, user, course, task };
			};

			it('should call courseRule.hasPermission', () => {
				const { user, task } = setup();
				const spy = jest.spyOn(courseRule, 'hasPermission');
				service.hasPermission(user, task, { action: Action.write, requiredPermissions: [permissionA] });
				expect(spy).toBeCalledWith(user, task.course, { action: Action.write, requiredPermissions: [] });
			});

			it('should return "true" if user in scope', () => {
				const { user, task } = setup();
				const res = service.hasPermission(user, task, { action: Action.read, requiredPermissions: [] });
				expect(res).toBe(true);
			});
		});

		describe('when user is teacher of course with lesson and course has task with permission A,B but not C', () => {
			const setup = () => {
				const role = roleFactory.build({ permissions: [permissionA, permissionB], name: RoleName.TEACHER });
				const user = userFactory.build({ roles: [role] });
				const course = courseEntityFactory.build({ teachers: [user] });
				const lesson = lessonFactory.build({ course, hidden: true });
				const task = taskFactory.build({ course, lesson });

				return { role, user, course, task, lesson };
			};

			it('should call lessonRule.hasPermission', () => {
				const { task, user } = setup();
				const spy = jest.spyOn(lessonRule, 'hasPermission');
				service.hasPermission(user, task, { action: Action.write, requiredPermissions: [permissionA] });
				expect(spy).toBeCalledWith(user, task.lesson, { action: Action.write, requiredPermissions: [] });
			});

			it('should return "true" if user is in scope and lesson hidden', () => {
				const { task, user } = setup();
				const res = service.hasPermission(user, task, { action: Action.read, requiredPermissions: [] });
				expect(res).toBe(true);
			});
		});

		describe('when task has no course or lesson', () => {
			const setup = () => {
				const role = roleFactory.build({ permissions: [permissionA, permissionB], name: RoleName.TEACHER });
				const creator = userFactory.build({ roles: [role] });
				const otherUser = userFactory.build({ roles: [role] });
				const task = taskFactory.build({ creator });

				return { role, creator, otherUser, task };
			};

			it('creator should have access to task', () => {
				const { creator, task } = setup();
				const res = service.hasPermission(creator, task, { action: Action.read, requiredPermissions: [] });
				expect(res).toBe(true);
			});

			it('otherUser should not have access to task', () => {
				const { otherUser, task } = setup();
				const res = service.hasPermission(otherUser, task, { action: Action.read, requiredPermissions: [] });
				expect(res).toBe(false);
			});
		});

		describe('when user is student and is task creator with Permission A,B', () => {
			const setup = () => {
				const role = roleFactory.build({ permissions: [permissionA, permissionB], name: RoleName.STUDENT });
				const student = userFactory.build({ roles: [role] });
				const task = taskFactory.build({ creator: student });

				return { role, student, task };
			};

			it('should return "true" if user is creator', () => {
				const { student, task } = setup();
				const res = service.hasPermission(student, task, { action: Action.read, requiredPermissions: [] });
				expect(res).toBe(true);
			});

			it('should return "false" if user has not permission for C', () => {
				const { student, task } = setup();
				const res = service.hasPermission(student, task, { action: Action.read, requiredPermissions: [permissionC] });
				expect(res).toBe(false);
			});
		});

		describe('when user is student of course and course has task with Permission A,B', () => {
			const setup = () => {
				const role = roleFactory.build({ permissions: [permissionA, permissionB], name: RoleName.STUDENT });
				const student = userFactory.build({ roles: [role] });
				const course = courseEntityFactory.build({ students: [student] });
				const task = taskFactory.build({ course });

				return { role, student, task, course };
			};

			it('should return "true" if user is in scope', () => {
				const { student, task } = setup();
				const res = service.hasPermission(student, task, { action: Action.read, requiredPermissions: [] });
				expect(res).toBe(true);
			});
		});

		describe('when user is student of course with hidden lesson and course has task with Permission A,B', () => {
			const setup = () => {
				const role = roleFactory.build({ permissions: [permissionA, permissionB], name: RoleName.STUDENT });
				const student = userFactory.build({ roles: [role] });
				const course = courseEntityFactory.build({ students: [student] });
				const lesson = lessonFactory.build({ course, hidden: true });
				const task = taskFactory.build({ course, lesson });

				return { role, student, task, course };
			};

			it('should return "false" if user in scope and lesson hidden', () => {
				const { student, task } = setup();
				const res = service.hasPermission(student, task, { action: Action.read, requiredPermissions: [] });
				expect(res).toBe(false);
			});
		});

		describe('when user is student of course with lesson and course has private task', () => {
			const setup = () => {
				const role = roleFactory.build({ permissions: [permissionA, permissionB], name: RoleName.STUDENT });
				const student = userFactory.build({ roles: [role] });
				const course = courseEntityFactory.build({ students: [student] });
				const lesson = lessonFactory.build({ course });
				const task = taskFactory.build({ course, lesson, private: true });

				return { role, student, task, course };
			};

			it('should return "false" if user in scope and task private', () => {
				const { student, task } = setup();
				const res = service.hasPermission(student, task, { action: Action.read, requiredPermissions: [] });
				expect(res).toBe(false);
			});
		});
	});
});
