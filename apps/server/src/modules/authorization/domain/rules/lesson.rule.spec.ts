import { DeepPartial } from '@mikro-orm/core';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LessonEntity, User } from '@shared/domain/entity';
import { Permission, RoleName } from '@shared/domain/interface';
import {
	courseFactory,
	courseGroupFactory,
	lessonFactory,
	roleFactory,
	setupEntities,
	userFactory,
} from '@shared/testing';
import { AuthorizationContextBuilder } from '../mapper';
import { AuthorizationHelper } from '../service/authorization.helper';
import { Action, AuthorizationContext } from '../type';
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
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthorizationHelper, LessonRule, CourseRule, CourseGroupRule],
		}).compile();

		rule = await module.get(LessonRule);
		authorizationHelper = await module.get(AuthorizationHelper);
		courseRule = await module.get(CourseRule);
		courseGroupRule = await module.get(CourseGroupRule);
	});

	beforeEach(() => {
		const role = roleFactory.build({ permissions: [permissionA, permissionB] });
		globalUser = userFactory.build({ roles: [role] });
	});

	it('should call hasAllPermissions on AuthorizationHelper', () => {
		entity = lessonFactory.build();
		const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');
		rule.hasPermission(globalUser, entity, { action: Action.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(globalUser, []);
	});

	it('should call courseRule.hasPermission', () => {
		const course = courseFactory.build({ teachers: [globalUser] });
		entity = lessonFactory.build({ course });
		const spy = jest.spyOn(courseRule, 'hasPermission');
		rule.hasPermission(globalUser, entity, { action: Action.write, requiredPermissions: [permissionA] });
		expect(spy).toBeCalledWith(globalUser, entity.course, { action: Action.write, requiredPermissions: [] });
	});

	it('should call courseGroupRule.hasPermission', () => {
		const course = courseFactory.build({ teachers: [globalUser] });
		const courseGroup = courseGroupFactory.build({ course });
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
				const course = courseFactory.build({ teachers: [user] });
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
			const course = courseFactory.build({ teachers: [globalUser] });
			entity = lessonFactory.build({ course });
			const res = rule.hasPermission(globalUser, entity, { action: Action.read, requiredPermissions: [permissionA] });
			expect(res).toBe(true);
		});

		it('should return "true" if user has access to hidden entity', () => {
			const course = courseFactory.build({ teachers: [globalUser] });
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
			const course = courseFactory.build({ students: [student] });
			entity = lessonFactory.build({ course });
			const res = rule.hasPermission(student, entity, { action: Action.read, requiredPermissions: [permissionA] });
			expect(res).toBe(true);
		});

		it('should return "false" if user has not access to hidden entity', () => {
			const course = courseFactory.build({ students: [student] });
			entity = lessonFactory.build({ course, hidden: true });
			const res = rule.hasPermission(student, entity, { action: Action.read, requiredPermissions: [permissionA] });
			expect(res).toBe(false);
		});
	});
});
