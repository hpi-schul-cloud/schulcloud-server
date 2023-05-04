import { DeepPartial } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission, RoleName } from '@shared/domain/interface';
import { courseFactory, lessonFactory, roleFactory, setupEntities, taskFactory, userFactory } from '@shared/testing';
import { CourseGroupRule, CourseRule, LessonRule, TaskRule } from '.';
import { AuthorizationHelper } from '../../../modules/authorization/authorization.helper';
import { Action } from '../../../modules/authorization/types';
import type { Role } from '../entity';
import { Task, User } from '../entity';

describe('TaskRule', () => {
	let service: TaskRule;
	let authorizationHelper: AuthorizationHelper;
	let courseRule: DeepPartial<CourseRule>;
	let lessonRule: DeepPartial<LessonRule>;
	let user: User;
	let entity: Task;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthorizationHelper, TaskRule, CourseRule, LessonRule, CourseGroupRule],
		}).compile();

		service = await module.get(TaskRule);
		authorizationHelper = await module.get(AuthorizationHelper);
		courseRule = await module.get(CourseRule);
		lessonRule = await module.get(LessonRule);
	});

	beforeEach(() => {
		const role = roleFactory.build({ permissions: [permissionA, permissionB] });
		user = userFactory.build({ roles: [role] });
	});

	it('should call hasAllPermissions on AuthorizationHelper', () => {
		entity = taskFactory.build({ creator: user });
		const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');
		service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, []);
	});

	it('should call hasAccessToEntity on AuthorizationHelper', () => {
		entity = taskFactory.build({ creator: user });
		const spy = jest.spyOn(authorizationHelper, 'hasAccessToEntity');
		service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, entity, ['creator']);
	});

	it('should call courseRule.hasPermission', () => {
		const course = courseFactory.build({ teachers: [user] });
		entity = taskFactory.build({ course });
		const spy = jest.spyOn(courseRule, 'hasPermission');
		service.hasPermission(user, entity, { action: Action.write, requiredPermissions: [permissionA] });
		expect(spy).toBeCalledWith(user, entity.course, { action: Action.write, requiredPermissions: [] });
	});

	it('should call lessonRule.hasPermission', () => {
		const course = courseFactory.build({ teachers: [user] });
		const lesson = lessonFactory.build({ course, hidden: true });
		entity = taskFactory.build({ course, lesson });
		const spy = jest.spyOn(lessonRule, 'hasPermission');
		service.hasPermission(user, entity, { action: Action.write, requiredPermissions: [permissionA] });
		expect(spy).toBeCalledWith(user, entity.lesson, { action: Action.write, requiredPermissions: [] });
	});

	describe('User [TEACHER]', () => {
		it('should return "true" if user is creator', () => {
			entity = taskFactory.build({ creator: user });
			const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
			expect(res).toBe(true);
		});

		it('should return "true" if user in scope', () => {
			const course = courseFactory.build({ teachers: [user] });
			entity = taskFactory.build({ course });
			const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
			expect(res).toBe(true);
		});

		it('should return "true" if user in scope and lesson hidden', () => {
			const course = courseFactory.build({ teachers: [user] });
			const lesson = lessonFactory.build({ course, hidden: true });
			entity = taskFactory.build({ course, lesson });
			const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
			expect(res).toBe(true);
		});

		it('should return "false" if user has not permission', () => {
			entity = taskFactory.build({ creator: user });
			const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [permissionC] });
			expect(res).toBe(false);
		});

		it('should return "false" if user has not access to entity', () => {
			entity = taskFactory.build();
			const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [permissionC] });
			expect(res).toBe(false);
		});
	});

	describe('User [STUDENT]', () => {
		let student: User;
		let role: Role;
		beforeEach(() => {
			role = roleFactory.build({ permissions: [permissionA, permissionB], name: RoleName.STUDENT });
			student = userFactory.build({ roles: [role] });
		});
		it('should return "true" if user is creator', () => {
			entity = taskFactory.build({ creator: user });
			const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
			expect(res).toBe(true);
		});

		it('should return "true" if user in scope', () => {
			const course = courseFactory.build({ students: [student] });
			entity = taskFactory.build({ course });
			const res = service.hasPermission(student, entity, { action: Action.read, requiredPermissions: [] });
			expect(res).toBe(true);
		});

		it('should return "false" if user in scope and lesson hidden', () => {
			const course = courseFactory.build({ students: [student] });
			const lesson = lessonFactory.build({ course, hidden: true });
			entity = taskFactory.build({ course, lesson });
			const res = service.hasPermission(student, entity, { action: Action.read, requiredPermissions: [] });
			expect(res).toBe(false);
		});

		it('should return "false" if user in scope and task private', () => {
			const course = courseFactory.build({ students: [student] });
			const lesson = lessonFactory.build({ course });
			entity = taskFactory.build({ course, lesson, private: true });
			const res = service.hasPermission(student, entity, { action: Action.read, requiredPermissions: [] });
			expect(res).toBe(false);
		});

		it('should return "false" if user has not permission', () => {
			entity = taskFactory.build({ creator: student });
			const res = service.hasPermission(student, entity, { action: Action.read, requiredPermissions: [permissionC] });
			expect(res).toBe(false);
		});

		it('should return "false" if user has not access to entity', () => {
			entity = taskFactory.build();
			const res = service.hasPermission(student, entity, { action: Action.read, requiredPermissions: [permissionC] });
			expect(res).toBe(false);
		});

		it('should return "false" if task has Assignees and user is not assigned ', () => {
			const otherStudent: User = userFactory.build({ roles: [role] });
			const course = courseFactory.build();
			entity = taskFactory.build({ course, users: [otherStudent] });
			const res = service.hasPermission(student, entity, { action: Action.read, requiredPermissions: [] });
			expect(res).toBe(false);
		});

		it('should return "true" if task has Assignees and user is assigned ', () => {
			const course = courseFactory.build();
			entity = taskFactory.build({ course, users: [student] });
			const res = service.hasPermission(student, entity, { action: Action.read, requiredPermissions: [] });
			expect(res).toBe(true);
		});
	});
});
