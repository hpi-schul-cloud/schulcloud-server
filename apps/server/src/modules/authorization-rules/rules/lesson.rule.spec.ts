import { DeepPartial } from '@mikro-orm/core';
import {
	Action,
	AUTHORIZATION_CONFIG_TOKEN,
	AuthorizationContext,
	AuthorizationContextBuilder,
	AuthorizationHelper,
	AuthorizationInjectionService,
} from '@modules/authorization';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory, courseGroupEntityFactory } from '@modules/course/testing';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { lessonFactory } from '@modules/lesson/testing';
import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { Submission, Task } from '@modules/task/repo';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { CourseGroupRule } from './course-group.rule';
import { CourseRule } from './course.rule';
import { LessonRule } from './lesson.rule';

describe('LessonRule', () => {
	let rule: LessonRule;
	let authorizationHelper: AuthorizationHelper;
	let courseRule: DeepPartial<CourseRule>;
	let courseGroupRule: DeepPartial<CourseGroupRule>;
	let globalUser: User;
	let entity: LessonEntity;
	let injectionService: AuthorizationInjectionService;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		await setupEntities([User, CourseEntity, CourseGroupEntity, Task, LessonEntity, Material, Submission]);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthorizationHelper,
				LessonRule,
				CourseRule,
				CourseGroupRule,
				AuthorizationInjectionService,
				{ provide: AUTHORIZATION_CONFIG_TOKEN, useValue: {} },
			],
		}).compile();

		rule = await module.get(LessonRule);
		authorizationHelper = await module.get(AuthorizationHelper);
		courseRule = await module.get(CourseRule);
		courseGroupRule = await module.get(CourseGroupRule);
		injectionService = await module.get(AuthorizationInjectionService);
	});

	beforeEach(() => {
		const role = roleFactory.build({ permissions: [permissionA, permissionB] });
		globalUser = userFactory.build({ roles: [role] });
	});

	describe('constructor', () => {
		it('should inject into AuthorizationInjectionService', () => {
			expect(injectionService.getAuthorizationRules()).toContain(rule);
		});
	});

	it('should call hasAllPermissions on AuthorizationHelper', () => {
		entity = lessonFactory.build();
		const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');
		rule.hasPermission(globalUser, entity, { action: Action.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(globalUser, []);
	});

	it('should call courseRule.hasPermission', () => {
		const course = courseEntityFactory.build({ teachers: [globalUser] });
		entity = lessonFactory.build({ course });
		const spy = jest.spyOn(courseRule, 'hasPermission');
		rule.hasPermission(globalUser, entity, { action: Action.write, requiredPermissions: [permissionA] });
		expect(spy).toBeCalledWith(globalUser, entity.course, { action: Action.write, requiredPermissions: [] });
	});

	it('should call courseGroupRule.hasPermission', () => {
		const course = courseEntityFactory.build({ teachers: [globalUser] });
		const courseGroup = courseGroupEntityFactory.build({ course });
		entity = lessonFactory.build({ course: undefined, courseGroup });

		const spy = jest.spyOn(courseGroupRule, 'hasPermission');
		rule.hasPermission(globalUser, entity, { action: Action.write, requiredPermissions: [permissionA] });
		expect(spy).toBeCalledWith(globalUser, entity.courseGroup, { action: Action.write, requiredPermissions: [] });
	});

	describe('Given user request not implemented action', () => {
		const getContext = (): AuthorizationContext => {
			const context: AuthorizationContext = {
				requiredPermissions: [],
				// @ts-expect-error Testcase
				action: 'not_implemented',
			};

			return context;
		};

		describe('when valid data exists', () => {
			const setup = () => {
				const user = userFactory.build();
				const course = courseEntityFactory.build({ teachers: [user] });
				const lesson = lessonFactory.build({ course });
				const context = getContext();

				return {
					user,
					lesson,
					context,
				};
			};

			it('should reject with NotImplementedException', () => {
				const { user, lesson, context } = setup();

				expect(() => rule.hasPermission(user, lesson, context)).toThrowError(NotImplementedException);
			});
		});
	});

	describe('Given user request Action.write', () => {
		const getWriteContext = () => AuthorizationContextBuilder.write([]);

		describe('when lesson has no course or coursegroup', () => {
			const setup = () => {
				const user = userFactory.build();
				const lessonEntity = lessonFactory.build({ course: undefined });
				const context = getWriteContext();

				return {
					user,
					lessonEntity,
					context,
				};
			};

			it('should return false', () => {
				const { user, lessonEntity, context } = setup();

				const result = rule.hasPermission(user, lessonEntity, context);

				expect(result).toBe(false);
			});
		});
	});

	describe('User [TEACHER]', () => {
		it('should return "true" if user in scope', () => {
			const course = courseEntityFactory.build({ teachers: [globalUser] });
			entity = lessonFactory.build({ course });
			const res = rule.hasPermission(globalUser, entity, { action: Action.read, requiredPermissions: [permissionA] });
			expect(res).toBe(true);
		});

		it('should return "true" if user has access to hidden entity', () => {
			const course = courseEntityFactory.build({ teachers: [globalUser] });
			entity = lessonFactory.build({ course, hidden: true });
			const res = rule.hasPermission(globalUser, entity, { action: Action.read, requiredPermissions: [permissionA] });
			expect(res).toBe(true);
		});

		it('should return "false" if user has not permission', () => {
			entity = lessonFactory.build();
			const res = rule.hasPermission(globalUser, entity, { action: Action.read, requiredPermissions: [permissionC] });
			expect(res).toBe(false);
		});

		it('should return "false" if user has not access to entity', () => {
			entity = lessonFactory.build();
			const res = rule.hasPermission(globalUser, entity, { action: Action.read, requiredPermissions: [permissionC] });
			expect(res).toBe(false);
		});
	});
	describe('User [STUDENT]', () => {
		let student: User;
		beforeEach(() => {
			const role = roleFactory.build({ permissions: [permissionA, permissionB], name: RoleName.STUDENT });
			student = userFactory.build({ roles: [role] });
		});

		it('should return "false" if user has access to entity', () => {
			const course = courseEntityFactory.build({ students: [student] });
			entity = lessonFactory.build({ course });
			const res = rule.hasPermission(student, entity, { action: Action.read, requiredPermissions: [permissionA] });
			expect(res).toBe(true);
		});

		it('should return "false" if user has not access to hidden entity', () => {
			const course = courseEntityFactory.build({ students: [student] });
			entity = lessonFactory.build({ course, hidden: true });
			const res = rule.hasPermission(student, entity, { action: Action.read, requiredPermissions: [permissionA] });
			expect(res).toBe(false);
		});
	});
});
