import { DeepPartial, MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, roleFactory, setupEntities, taskFactory, userFactory } from '@shared/testing';
import { CourseRule } from '.';
import { Task, User } from '../entity';
import { Permission } from '../interface';
import { Actions } from './actions.enum';
import { TaskRule } from './task.rule';

describe('TaskRule', () => {
	let orm: MikroORM;
	let service: TaskRule;
	let courseRule: DeepPartial<CourseRule>;
	let user: User;
	let entity: Task;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		orm = await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [TaskRule, CourseRule],
		}).compile();

		service = await module.get(TaskRule);
		courseRule = await module.get(CourseRule);
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(() => {
		const role = roleFactory.build({ permissions: [permissionA, permissionB] });
		user = userFactory.build({ roles: [role] });
	});

	it('should call baseRule.hasAllPermissions', () => {
		entity = taskFactory.build({ creator: user });
		const spy = jest.spyOn(service, 'hasAllPermissions');
		service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, []);
	});

	it('should call baseRule.hasAccessToEntity', () => {
		entity = taskFactory.build({ creator: user });
		const spy = jest.spyOn(service, 'hasAccessToEntity');
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

	it('should return "true" if user in scope', () => {
		entity = taskFactory.build({ creator: user });
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
