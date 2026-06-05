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
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { CourseGroupRule } from './course-group.rule';
import { CourseRule } from './course.rule';
import { LessonRule } from './lesson.rule';
import { TaskRule } from './task.rule';

const createUserWithPermissions = (roleName?: RoleName) => {
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;
	const role = roleFactory.build({ permissions: [permissionA, permissionB], name: roleName });
	const user = userFactory.build({ roles: [role] });

	return { user, permissionA, permissionB, permissionC };
};

describe('TaskRule', () => {
	let service: TaskRule;
	let authorizationHelper: AuthorizationHelper;
	let courseRule: DeepPartial<CourseRule>;
	let lessonRule: DeepPartial<LessonRule>;
	let injectionService: AuthorizationInjectionService;

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
				const { user, permissionC } = createUserWithPermissions();
				const task = taskFactory.build();

				return { user, task, permissionC };
			};

			it('should return "false" if user has not access to task', () => {
				const { user, task, permissionC } = setup();
				const res = service.hasPermission(user, task, { action: Action.read, requiredPermissions: [permissionC] });
				expect(res).toBe(false);
			});
		});
		describe('when user is task creator with some permission granted', () => {
			const setup = () => {
				const { user, permissionA, permissionB, permissionC } = createUserWithPermissions();
				const task = taskFactory.build({ creator: user });

				return { user, task, permissionA, permissionB, permissionC };
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
				const { user, task, permissionC } = setup();

				const res = service.hasPermission(user, task, { action: Action.read, requiredPermissions: [permissionC] });

				expect(res).toBe(false);
			});
		});

		describe('when user is teacher of course and course has task with permission A,B but not C', () => {
			const setup = () => {
				const { user, permissionA, permissionB } = createUserWithPermissions(RoleName.TEACHER);
				const course = courseEntityFactory.build({ teachers: [user] });
				const task = taskFactory.build({ course });

				return { user, course, task, permissionA, permissionB };
			};

			it('should call courseRule.hasPermission', () => {
				const { user, task, permissionA } = setup();
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
				const { user, permissionA, permissionB } = createUserWithPermissions(RoleName.TEACHER);
				const course = courseEntityFactory.build({ teachers: [user] });
				const lesson = lessonFactory.build({ course, hidden: true });
				const task = taskFactory.build({ course, lesson });

				return { user, course, task, lesson, permissionA, permissionB };
			};

			it('should call lessonRule.hasPermission', () => {
				const { task, user, permissionA } = setup();
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
				const { user: creator } = createUserWithPermissions(RoleName.TEACHER);
				const { user: otherUser } = createUserWithPermissions(RoleName.TEACHER);
				const task = taskFactory.build({ creator });

				return { creator, otherUser, task };
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
				const { user: student, permissionC } = createUserWithPermissions(RoleName.STUDENT);
				const task = taskFactory.build({ creator: student });

				return { student, task, permissionC };
			};

			it('should return "true" if user is creator', () => {
				const { student, task } = setup();

				const res = service.hasPermission(student, task, { action: Action.read, requiredPermissions: [] });

				expect(res).toBe(true);
			});

			it('should return "false" if user has not permission for C', () => {
				const { student, task, permissionC } = setup();

				const res = service.hasPermission(student, task, { action: Action.read, requiredPermissions: [permissionC] });

				expect(res).toBe(false);
			});
		});

		describe('when user is student of course and course has task with Permission A,B', () => {
			const setup = () => {
				const { user: student, permissionA, permissionB } = createUserWithPermissions(RoleName.STUDENT);
				const course = courseEntityFactory.build({ students: [student] });
				const task = taskFactory.build({ course });

				return { student, task, course, permissionA, permissionB };
			};

			it('should return "true" if user is in scope', () => {
				const { student, task } = setup();

				const res = service.hasPermission(student, task, { action: Action.read, requiredPermissions: [] });

				expect(res).toBe(true);
			});
		});

		describe('when user is student of course with hidden lesson and course has task with Permission A,B', () => {
			const setup = () => {
				const { user: student } = createUserWithPermissions(RoleName.STUDENT);
				const course = courseEntityFactory.build({ students: [student] });
				const lesson = lessonFactory.build({ course, hidden: true });
				const task = taskFactory.build({ course, lesson });

				return { student, task };
			};

			it('should return "false" if user in scope and lesson hidden', () => {
				const { student, task } = setup();

				const res = service.hasPermission(student, task, { action: Action.read, requiredPermissions: [] });

				expect(res).toBe(false);
			});
		});

		describe('when user is student of course with lesson and course has private task', () => {
			const setup = () => {
				const { user: student } = createUserWithPermissions(RoleName.STUDENT);
				const course = courseEntityFactory.build({ students: [student] });
				const lesson = lessonFactory.build({ course });
				const task = taskFactory.build({ course, lesson, private: true });

				return { student, task };
			};

			it('should return "false" if user in scope and task private', () => {
				const { student, task } = setup();

				const res = service.hasPermission(student, task, { action: Action.read, requiredPermissions: [] });

				expect(res).toBe(false);
			});
		});

		describe('when user has CAN_EXECUTE_INSTANCE_OPERATIONS permission', () => {
			describe('when user has instance operation permission for read action', () => {
				const setup = () => {
					const role = roleFactory.build({ permissions: [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS] });
					const user = userFactory.build({ roles: [role] });
					const { user: creator } = createUserWithPermissions(RoleName.TEACHER);
					const course = courseEntityFactory.build({ teachers: [creator] });
					const task = taskFactory.build({ course, creator });

					return { user, task };
				};

				it('should return "true" even without being creator or in course', () => {
					const { user, task } = setup();

					const res = service.hasPermission(user, task, { action: Action.read, requiredPermissions: [] });

					expect(res).toBe(true);
				});
			});

			describe('when user has instance operation permission for write action', () => {
				const setup = () => {
					const role = roleFactory.build({ permissions: [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS] });
					const user = userFactory.build({ roles: [role] });
					const { user: creator } = createUserWithPermissions(RoleName.TEACHER);
					const course = courseEntityFactory.build({ teachers: [creator] });
					const task = taskFactory.build({ course, creator });

					return { user, task };
				};

				it('should return "true" even without being creator or in course', () => {
					const { user, task } = setup();

					const res = service.hasPermission(user, task, { action: Action.write, requiredPermissions: [] });

					expect(res).toBe(true);
				});
			});

			describe('when user has instance operation permission but missing required permissions', () => {
				const setup = () => {
					const role = roleFactory.build({ permissions: [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS] });
					const user = userFactory.build({ roles: [role] });
					const task = taskFactory.build();
					const missingPermission = 'missing' as Permission;

					return { user, task, missingPermission };
				};

				it('should return "false" when required permissions are not met', () => {
					const { user, task, missingPermission } = setup();

					const res = service.hasPermission(user, task, {
						action: Action.read,
						requiredPermissions: [missingPermission],
					});

					expect(res).toBe(false);
				});
			});
		});

		describe('when the action is not read or write', () => {
			const setup = () => {
				const { user } = createUserWithPermissions();
				const task = taskFactory.build({ creator: user });

				return { user, task };
			};

			it('should throw NotImplementedException', () => {
				const { user, task } = setup();

				expect(() =>
					service.hasPermission(user, task, { action: 'unknown' as Action, requiredPermissions: [] })
				).toThrow(NotImplementedException);
			});
		});
	});
});
