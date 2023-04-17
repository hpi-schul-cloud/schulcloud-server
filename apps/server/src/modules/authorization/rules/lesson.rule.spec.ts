import { DeepPartial } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Lesson, User } from '@shared/domain/entity';
import { Permission, RoleName } from '@shared/domain/interface';
import {
	courseFactory,
	courseGroupFactory,
	lessonFactory,
	roleFactory,
	setupEntities,
	userFactory,
} from '@shared/testing';
import { CourseGroupRule, CourseRule } from '.';
import { AuthorizationHelper } from '../authorization.helper';
import { Action } from '../types';
import { LessonRule } from './lesson.rule';

describe('LessonRule', () => {
	let service: LessonRule;
	let authorizationHelper: AuthorizationHelper;
	let courseRule: DeepPartial<CourseRule>;
	let courseGroupRule: DeepPartial<CourseGroupRule>;
	let user: User;
	let entity: Lesson;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthorizationHelper, LessonRule, CourseRule, CourseGroupRule],
		}).compile();

		service = await module.get(LessonRule);
		authorizationHelper = await module.get(AuthorizationHelper);
		courseRule = await module.get(CourseRule);
		courseGroupRule = await module.get(CourseGroupRule);
	});

	beforeEach(() => {
		const role = roleFactory.build({ permissions: [permissionA, permissionB] });
		user = userFactory.build({ roles: [role] });
	});

	it('should call hasAllPermissions on AuthorizationHelper', () => {
		entity = lessonFactory.build();
		const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');
		service.isAuthorized(user, entity, { action: Action.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, []);
	});

	it('should call courseRule.isAuthorized', () => {
		const course = courseFactory.build({ teachers: [user] });
		entity = lessonFactory.build({ course });
		const spy = jest.spyOn(courseRule, 'isAuthorized');
		service.isAuthorized(user, entity, { action: Action.write, requiredPermissions: [permissionA] });
		expect(spy).toBeCalledWith(user, entity.course, { action: Action.write, requiredPermissions: [] });
	});

	it('should call courseGroupRule.isAuthorized', () => {
		const course = courseFactory.build({ teachers: [user] });
		const courseGroup = courseGroupFactory.build({ course });
		entity = lessonFactory.build({ course: undefined, courseGroup });

		const spy = jest.spyOn(courseGroupRule, 'isAuthorized');
		service.isAuthorized(user, entity, { action: Action.write, requiredPermissions: [permissionA] });
		expect(spy).toBeCalledWith(user, entity.courseGroup, { action: Action.write, requiredPermissions: [] });
	});

	describe('User [TEACHER]', () => {
		it('should return "true" if user in scope', () => {
			const course = courseFactory.build({ teachers: [user] });
			entity = lessonFactory.build({ course });
			const res = service.isAuthorized(user, entity, { action: Action.read, requiredPermissions: [permissionA] });
			expect(res).toBe(true);
		});

		it('should return "true" if user has access to hidden entity', () => {
			const course = courseFactory.build({ teachers: [user] });
			entity = lessonFactory.build({ course, hidden: true });
			const res = service.isAuthorized(user, entity, { action: Action.read, requiredPermissions: [permissionA] });
			expect(res).toBe(true);
		});

		it('should return "false" if user has not permission', () => {
			entity = lessonFactory.build();
			const res = service.isAuthorized(user, entity, { action: Action.read, requiredPermissions: [permissionC] });
			expect(res).toBe(false);
		});

		it('should return "false" if user has not access to entity', () => {
			entity = lessonFactory.build();
			const res = service.isAuthorized(user, entity, { action: Action.read, requiredPermissions: [permissionC] });
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
			const res = service.isAuthorized(student, entity, { action: Action.read, requiredPermissions: [permissionA] });
			expect(res).toBe(true);
		});

		it('should return "false" if user has not access to hidden entity', () => {
			const course = courseFactory.build({ students: [student] });
			entity = lessonFactory.build({ course, hidden: true });
			const res = service.isAuthorized(student, entity, { action: Action.read, requiredPermissions: [permissionA] });
			expect(res).toBe(false);
		});
	});
});
