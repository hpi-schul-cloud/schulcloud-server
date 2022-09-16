import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
	courseFactory,
	roleFactory,
	setupEntities,
	submissionFactory,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { CourseGroupRule, CourseRule, LessonRule, SubmissionRule, TaskRule } from '.';
import { Submission, User } from '../entity';
import { Permission, RoleName } from '../interface';
import { Actions } from './actions.enum';

describe('TaskRule', () => {
	let orm: MikroORM;
	let service: SubmissionRule;
	let taskRule: TaskRule;
	let user: User;
	let teacher: User;
	let entity: Submission;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		orm = await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [TaskRule, CourseRule, LessonRule, CourseGroupRule, SubmissionRule],
		}).compile();

		service = await module.get(SubmissionRule);
		taskRule = await module.get(TaskRule);
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(() => {
		const role = roleFactory.build({ permissions: [permissionA, permissionB], name: RoleName.STUDENT });
		const teacherRole = roleFactory.build({ permissions: [permissionC] });
		user = userFactory.build({ roles: [role] });
		teacher = userFactory.build({ roles: [teacherRole] });
	});

	it('should call baseRule.hasAllPermissions', () => {
		const task = taskFactory.build();
		entity = submissionFactory.build({ task, student: user });
		const spy = jest.spyOn(service.utils, 'hasAllPermissions');
		service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, []);
	});

	it('should call baseRule.hasAccessToEntity', () => {
		const task = taskFactory.build();
		entity = submissionFactory.build({ task, student: user });
		const spy = jest.spyOn(service.utils, 'hasAccessToEntity');
		service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, entity, ['student']);
	});

	it('should call taskRule.hasPermission', () => {
		const course = courseFactory.build({ teachers: [teacher] });
		const task = taskFactory.build({ course });
		entity = submissionFactory.build({ task, student: user });
		const spy = jest.spyOn(taskRule, 'hasPermission');
		service.hasPermission(user, entity, { action: Actions.write, requiredPermissions: [permissionA] });
		expect(spy).toBeCalledWith(user, entity.task, { action: Actions.write, requiredPermissions: [] });
	});

	describe('User [TEACHER]', () => {
		beforeEach(() => {
			const role = roleFactory.build({ permissions: [permissionA, permissionB], name: RoleName.STUDENT });
			const teacherRole = roleFactory.build({ permissions: [permissionC] });
			user = userFactory.build({ roles: [role] });
			teacher = userFactory.build({ roles: [teacherRole] });
		});
		describe('Action [READ]', () => {
			it('should return "true" if in scope', () => {
				const course = courseFactory.build({ teachers: [teacher] });
				const task = taskFactory.build({ course });
				entity = submissionFactory.build({ task, student: user });
				const res = service.hasPermission(teacher, entity, { action: Actions.read, requiredPermissions: [] });
				expect(res).toBe(true);
			});

			it('should return "false" if user has not permission', () => {
				const course = courseFactory.build({ teachers: [teacher] });
				const task = taskFactory.build({ course });
				entity = submissionFactory.build({ task, student: user });
				const res = service.hasPermission(teacher, entity, {
					action: Actions.read,
					requiredPermissions: [permissionA],
				});
				expect(res).toBe(false);
			});

			it('should return "false" if user has not access to entity', () => {
				const task = taskFactory.build();
				entity = submissionFactory.build({ task, student: user });
				const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [permissionC] });
				expect(res).toBe(false);
			});
		});

		describe('Action [WRITE]', () => {
			it('should return "true" if in scope', () => {
				const course = courseFactory.build({ teachers: [teacher] });
				const task = taskFactory.build({ course });
				entity = submissionFactory.build({ task, student: user });
				const res = service.hasPermission(teacher, entity, { action: Actions.write, requiredPermissions: [] });
				expect(res).toBe(true);
			});

			it('should return "false" if user has not permission', () => {
				const course = courseFactory.build({ teachers: [teacher] });
				const task = taskFactory.build({ course });
				entity = submissionFactory.build({ task, student: user });
				const res = service.hasPermission(teacher, entity, {
					action: Actions.write,
					requiredPermissions: [permissionA],
				});
				expect(res).toBe(false);
			});

			it('should return "false" if user has not access to entity', () => {
				const task = taskFactory.build();
				entity = submissionFactory.build({ task, student: user });
				const res = service.hasPermission(user, entity, { action: Actions.write, requiredPermissions: [permissionC] });
				expect(res).toBe(false);
			});
		});
	});

	describe('User [STUDENT]', () => {
		beforeEach(() => {
			const role = roleFactory.build({ permissions: [permissionA, permissionB], name: RoleName.STUDENT });
			const teacherRole = roleFactory.build({ permissions: [permissionC] });
			user = userFactory.build({ roles: [role] });
			teacher = userFactory.build({ roles: [teacherRole] });
		});
		describe('Action [READ]', () => {
			it('should return "true" if user is creator', () => {
				const task = taskFactory.build();
				entity = submissionFactory.build({ task, student: user });
				const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
				expect(res).toBe(true);
			});

			it('should return "false" if user has not permission', () => {
				const task = taskFactory.build({ creator: user });
				entity = submissionFactory.build({ task, student: user });
				const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [permissionC] });
				expect(res).toBe(false);
			});
		});

		describe('Action [WRITE]', () => {
			it('should return "true" if user is creator', () => {
				const task = taskFactory.build();
				entity = submissionFactory.build({ task, student: user });
				const res = service.hasPermission(user, entity, { action: Actions.write, requiredPermissions: [] });
				expect(res).toBe(true);
			});

			it('should return "false" if user has not permission', () => {
				const task = taskFactory.build({ creator: user });
				entity = submissionFactory.build({ task, student: user });
				const res = service.hasPermission(user, entity, { action: Actions.write, requiredPermissions: [permissionC] });
				expect(res).toBe(false);
			});
		});
	});

	describe('User in course [OTHER STUDENT]', () => {
		let otherStudent: User;
		beforeEach(() => {
			const role = roleFactory.build({ permissions: [permissionA, permissionB], name: RoleName.STUDENT });
			const teacherRole = roleFactory.build({ permissions: [permissionC] });
			user = userFactory.build({ roles: [role] });
			teacher = userFactory.build({ roles: [teacherRole] });
			otherStudent = userFactory.build({ roles: [role] });
		});

		describe('Actions [READ]', () => {
			it('should return "false" if user is [NOT] a creator', () => {
				const course = courseFactory.build({ students: [user, otherStudent] });
				const task = taskFactory.build({ course });
				entity = submissionFactory.build({ task, student: user });
				const res = service.hasPermission(otherStudent, entity, { action: Actions.read, requiredPermissions: [] });
				expect(res).toBe(false);
			});

			describe('publicSubmissions', () => {
				it('should return "true" if user in scope', () => {
					const course = courseFactory.build({ students: [otherStudent] });
					const task = taskFactory.build({ course, publicSubmissions: true });
					entity = submissionFactory.build({ task, student: user });
					const res = service.hasPermission(otherStudent, entity, { action: Actions.read, requiredPermissions: [] });
					expect(res).toBe(true);
				});

				it('should return "false" if user not in scope', () => {
					const course = courseFactory.build({ students: [user] });
					const task = taskFactory.build({ course, publicSubmissions: true });
					entity = submissionFactory.build({ task, student: user });
					const res = service.hasPermission(otherStudent, entity, { action: Actions.read, requiredPermissions: [] });
					expect(res).toBe(false);
				});
			});
		});

		describe('Actions [WRITE]', () => {
			it('should return "false" if user is [NOT] a creator', () => {
				const course = courseFactory.build({ students: [user, otherStudent] });
				const task = taskFactory.build({ course });
				entity = submissionFactory.build({ task, student: user });
				const res = service.hasPermission(otherStudent, entity, { action: Actions.write, requiredPermissions: [] });
				expect(res).toBe(false);
			});

			describe('publicSubmissions', () => {
				it('should return "false" if user in scope', () => {
					const course = courseFactory.build({ students: [otherStudent] });
					const task = taskFactory.build({ course, publicSubmissions: true });
					entity = submissionFactory.build({ task, student: user });
					const res = service.hasPermission(otherStudent, entity, { action: Actions.write, requiredPermissions: [] });
					expect(res).toBe(false);
				});

				it('should return "false" if user not in scope', () => {
					const course = courseFactory.build({ students: [user] });
					const task = taskFactory.build({ course, publicSubmissions: true });
					entity = submissionFactory.build({ task, student: user });
					const res = service.hasPermission(otherStudent, entity, { action: Actions.write, requiredPermissions: [] });
					expect(res).toBe(false);
				});
			});
		});
	});
});
