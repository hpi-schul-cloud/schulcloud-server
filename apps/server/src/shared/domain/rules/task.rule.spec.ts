import { DeepPartial } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, lessonFactory, roleFactory, setupEntities, taskFactory, userFactory } from '@shared/testing';
import { CourseGroupRule, CourseRule, LessonRule, TaskRule } from '.';
import { Task, User } from '../entity';
import type { Role } from '../entity';
import { Permission, RoleName } from '../interface';
import { Actions } from './actions.enum';

describe('TaskRule', () => {
	let service: TaskRule;
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
			providers: [TaskRule, CourseRule, LessonRule, CourseGroupRule],
		}).compile();

		service = await module.get(TaskRule);
		courseRule = await module.get(CourseRule);
		lessonRule = await module.get(LessonRule);
	});

	beforeEach(() => {
		const role = roleFactory.build({ permissions: [permissionA, permissionB] });
		user = userFactory.build({ roles: [role] });
	});

	it('should call baseRule.hasAllPermissions', () => {
		entity = taskFactory.build({ creator: user });
		const spy = jest.spyOn(service.utils, 'hasAllPermissions');
		service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, []);
	});

	it('should call baseRule.hasAccessToEntity', () => {
		entity = taskFactory.build({ creator: user });
		const spy = jest.spyOn(service.utils, 'hasAccessToEntity');
		service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, entity, ['creator']);
	});

	it('should call courseRule.hasPermission', () => {
		const course = courseFactory.build({ teachers: [user] });
		entity = taskFactory.build({ course });
		const spy = jest.spyOn(courseRule, 'hasPermission');
		service.hasPermission(user, entity, { action: Actions.write, requiredPermissions: [permissionA] });
		expect(spy).toBeCalledWith(user, entity.course, { action: Actions.write, requiredPermissions: [] });
	});

	it('should call lessonRule.hasPermission', () => {
		const course = courseFactory.build({ teachers: [user] });
		const lesson = lessonFactory.build({ course, hidden: true });
		entity = taskFactory.build({ course, lesson });
		const spy = jest.spyOn(lessonRule, 'hasPermission');
		service.hasPermission(user, entity, { action: Actions.write, requiredPermissions: [permissionA] });
		expect(spy).toBeCalledWith(user, entity.lesson, { action: Actions.write, requiredPermissions: [] });
	});

	describe('User [TEACHER]', () => {
		it('should return "true" if user is creator', () => {
			entity = taskFactory.build({ creator: user });
			const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
			expect(res).toBe(true);
		});

		it('should return "true" if user in scope', () => {
			const course = courseFactory.build({ teachers: [user] });
			entity = taskFactory.build({ course });
			const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
			expect(res).toBe(true);
		});

		it('should return "true" if user in scope and lesson hidden', () => {
			const course = courseFactory.build({ teachers: [user] });
			const lesson = lessonFactory.build({ course, hidden: true });
			entity = taskFactory.build({ course, lesson });
			const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
			expect(res).toBe(true);
		});

		it('should return "false" if user has not permission', () => {
			entity = taskFactory.build({ creator: user });
			const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [permissionC] });
			expect(res).toBe(false);
		});

		it('should return "false" if user has not access to entity', () => {
			entity = taskFactory.build();
			const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [permissionC] });
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
			const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
			expect(res).toBe(true);
		});

		it('should return "true" if user in scope', () => {
			const course = courseFactory.build({ students: [student] });
			entity = taskFactory.build({ course });
			const res = service.hasPermission(student, entity, { action: Actions.read, requiredPermissions: [] });
			expect(res).toBe(true);
		});

		it('should return "false" if user in scope and lesson hidden', () => {
			const course = courseFactory.build({ students: [student] });
			const lesson = lessonFactory.build({ course, hidden: true });
			entity = taskFactory.build({ course, lesson });
			const res = service.hasPermission(student, entity, { action: Actions.read, requiredPermissions: [] });
			expect(res).toBe(false);
		});

		it('should return "false" if user in scope and task private', () => {
			const course = courseFactory.build({ students: [student] });
			const lesson = lessonFactory.build({ course });
			entity = taskFactory.build({ course, lesson, private: true });
			const res = service.hasPermission(student, entity, { action: Actions.read, requiredPermissions: [] });
			expect(res).toBe(false);
		});

		it('should return "false" if user has not permission', () => {
			entity = taskFactory.build({ creator: student });
			const res = service.hasPermission(student, entity, { action: Actions.read, requiredPermissions: [permissionC] });
			expect(res).toBe(false);
		});

		it('should return "false" if user has not access to entity', () => {
			entity = taskFactory.build();
			const res = service.hasPermission(student, entity, { action: Actions.read, requiredPermissions: [permissionC] });
			expect(res).toBe(false);
		});

		it('should return false if task has Assignees and user is not assigned ', () => {
			const otherStudent: User = userFactory.build({ roles: [role] });
			entity = taskFactory.build({ users: [otherStudent] });
			const res = service.hasPermission(student, entity, { action: Actions.read, requiredPermissions: [permissionC] });
			expect(res).toBe(false);
		});

		it('should return true if task has Assignees and user is not assigned ', () => {
			entity = taskFactory.build({ users: [student] });
			const res = service.hasPermission(student, entity, { action: Actions.read, requiredPermissions: [permissionC] });
			expect(res).toBe(false);
		});
	});
});
