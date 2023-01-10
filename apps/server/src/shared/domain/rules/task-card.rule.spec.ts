import { DeepPartial, MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { roleFactory, setupEntities, taskCardFactory, taskFactory, userFactory } from '@shared/testing';
import { CourseGroupRule, CourseRule, LessonRule, TaskCardRule, TaskRule } from '.';
import { TaskCard, User } from '../entity';
import { Permission, RoleName } from '../interface';
import { Actions } from './actions.enum';

describe('TaskCardRule', () => {
	let orm: MikroORM;
	let service: TaskCardRule;
	let taskRule: DeepPartial<TaskRule>;
	let user: User;
	let entity: TaskCard;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		orm = await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [TaskCardRule, TaskRule, CourseRule, LessonRule, CourseGroupRule],
		}).compile();

		service = await module.get(TaskCardRule);
		taskRule = await module.get(TaskRule);
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(() => {
		const role = roleFactory.build({ permissions: [permissionA, permissionB] });
		user = userFactory.build({ roles: [role] });
	});

	it('should call baseRule.hasAllPermissions', () => {
		entity = taskCardFactory.build({ creator: user });
		const spy = jest.spyOn(service.utils, 'hasAllPermissions');
		service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, []);
	});

	it('should call baseRule.hasAccessToEntity', () => {
		entity = taskCardFactory.build({ creator: user });
		const spy = jest.spyOn(service.utils, 'hasAccessToEntity');
		service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, entity, ['creator']);
	});

	it('should call taskRule.hasPermission', () => {
		const task = taskFactory.build({ creator: user });
		entity = taskCardFactory.build({ task });
		const spy = jest.spyOn(taskRule, 'hasPermission');
		service.hasPermission(user, entity, { action: Actions.write, requiredPermissions: [permissionA] });
		expect(spy).toBeCalledWith(user, entity.task, { action: Actions.write, requiredPermissions: [] });
	});

	describe('User [TEACHER]', () => {
		it('should return "true" if user is creator', () => {
			entity = taskCardFactory.build({ creator: user });
			const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
			expect(res).toBe(true);
		});

		it('should return "true" if user is in scope of task', () => {
			const task = taskFactory.build({ creator: user });
			entity = taskCardFactory.build({ task });
			const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
			expect(res).toBe(true);
		});

		it('should return "false" if user does not have permission', () => {
			entity = taskCardFactory.build({ creator: user });
			const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [permissionC] });
			expect(res).toBe(false);
		});

		it('should return "false" if user does not have access to entity', () => {
			entity = taskCardFactory.build();
			const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [permissionC] });
			expect(res).toBe(false);
		});
	});

	describe('User [STUDENT]', () => {
		let student: User;
		beforeEach(() => {
			const role = roleFactory.build({ permissions: [permissionA, permissionB], name: RoleName.STUDENT });
			student = userFactory.build({ roles: [role] });
		});
		it('should return "true" if user is creator', () => {
			entity = taskCardFactory.build({ creator: user });
			const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
			expect(res).toBe(true);
		});

		it('should return "true" if user is in scope of task', () => {
			const task = taskFactory.build({ creator: student });
			entity = taskCardFactory.build({ task });
			const res = service.hasPermission(student, entity, { action: Actions.read, requiredPermissions: [] });
			expect(res).toBe(true);
		});

		it('should return "false" if user does not have permission', () => {
			entity = taskCardFactory.build({ creator: student });
			const res = service.hasPermission(student, entity, { action: Actions.read, requiredPermissions: [permissionC] });
			expect(res).toBe(false);
		});

		it('should return "false" if user has not access to entity', () => {
			entity = taskCardFactory.build();
			const res = service.hasPermission(student, entity, { action: Actions.read, requiredPermissions: [permissionC] });
			expect(res).toBe(false);
		});
	});
});
