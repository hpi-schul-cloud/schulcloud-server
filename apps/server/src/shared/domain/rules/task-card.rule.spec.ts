import { DeepPartial } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { roleFactory, setupEntities, taskCardFactory, taskFactory, userFactory } from '@shared/testing';
import { CourseGroupRule, CourseRule, LessonRule, TaskCardRule, TaskRule } from '.';
import { Role, TaskCard, User } from '../entity';
import { Permission } from '../interface';
import { Actions } from './actions.enum';

describe('TaskCardRule', () => {
	let service: TaskCardRule;
	let taskRule: DeepPartial<TaskRule>;
	let role: Role;
	let user: User;
	let entity: TaskCard;
	const homeworkEdit = Permission.HOMEWORK_EDIT;
	const homeworkView = Permission.HOMEWORK_VIEW;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [TaskCardRule, TaskRule, CourseRule, LessonRule, CourseGroupRule],
		}).compile();

		service = await module.get(TaskCardRule);
		taskRule = await module.get(TaskRule);
	});

	beforeEach(() => {
		role = roleFactory.build({ permissions: [homeworkEdit, homeworkView] });
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
		service.hasPermission(user, entity, { action: Actions.write, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, entity.task, { action: Actions.write, requiredPermissions: [homeworkEdit] });
	});

	describe('User is creator of the task card', () => {
		describe('Access via read action', () => {
			it('should return "true" if user has HOMEWORK_EDIT and HOMEWORK_VIEW permission', () => {
				role = roleFactory.build({ permissions: [homeworkEdit, homeworkView] });
				const creator = userFactory.build({ roles: [role] });
				const task = taskFactory.build({ creator });
				entity = taskCardFactory.build({ creator, task });
				const res = service.hasPermission(creator, entity, { action: Actions.read, requiredPermissions: [] });
				expect(res).toBe(true);
			});

			it('should return "true" if user has HOMEWORK_VIEW permission', () => {
				role = roleFactory.build({ permissions: [homeworkView] });
				const creator = userFactory.build({ roles: [role] });
				const task = taskFactory.build({ creator });
				entity = taskCardFactory.build({ creator, task });
				const res = service.hasPermission(creator, entity, { action: Actions.read, requiredPermissions: [] });
				expect(res).toBe(true);
			});

			it('should return "true" if user does not have HOMEWORK_VIEW or HOMEWORK_EDIT permission', () => {
				role = roleFactory.build({ permissions: [] });
				const creator = userFactory.build({ roles: [role] });
				const task = taskFactory.build({ creator });
				entity = taskCardFactory.build({ creator, task });
				const res = service.hasPermission(creator, entity, { action: Actions.read, requiredPermissions: [] });
				expect(res).toBe(true);
			});

			it('should return "false" if required permission is not met', () => {
				role = roleFactory.build({ permissions: [homeworkEdit, homeworkView] });
				const creator = userFactory.build({ roles: [role] });
				const task = taskFactory.build({ creator });
				entity = taskCardFactory.build({ creator, task });
				const res = service.hasPermission(creator, entity, {
					action: Actions.read,
					requiredPermissions: [Permission.TASK_CARD_VIEW],
				});
				expect(res).toBe(false);
			});
		});

		describe('Access via write action', () => {
			it('should return "true" if user has HOMEWORK_EDIT and HOMEWORK_VIEW permission', () => {
				role = roleFactory.build({ permissions: [homeworkEdit, homeworkView] });
				const creator = userFactory.build({ roles: [role] });
				const task = taskFactory.build({ creator });
				entity = taskCardFactory.build({ creator, task });
				const res = service.hasPermission(creator, entity, { action: Actions.write, requiredPermissions: [] });
				expect(res).toBe(true);
			});

			it('should return "true" if user has HOMEWORK_VIEW permission', () => {
				role = roleFactory.build({ permissions: [homeworkView] });
				const creator = userFactory.build({ roles: [role] });
				const task = taskFactory.build({ creator });
				entity = taskCardFactory.build({ creator, task });
				const res = service.hasPermission(creator, entity, { action: Actions.write, requiredPermissions: [] });
				expect(res).toBe(true);
			});

			it('should return "true" if user does not have HOMEWORK_VIEW or HOMEWORK_EDIT permission', () => {
				role = roleFactory.build({ permissions: [] });
				const creator = userFactory.build({ roles: [role] });
				const task = taskFactory.build({ creator });
				entity = taskCardFactory.build({ creator, task });
				const res = service.hasPermission(creator, entity, { action: Actions.write, requiredPermissions: [] });
				expect(res).toBe(true);
			});

			it('should return "false" if required permission is not met', () => {
				role = roleFactory.build({ permissions: [homeworkEdit, homeworkView] });
				const creator = userFactory.build({ roles: [role] });
				const task = taskFactory.build({ creator });
				entity = taskCardFactory.build({ creator, task });
				const res = service.hasPermission(creator, entity, {
					action: Actions.write,
					requiredPermissions: [Permission.TASK_CARD_VIEW],
				});
				expect(res).toBe(false);
			});
		});
	});

	describe('User is NOT creator of the task card', () => {
		describe('Access via read action', () => {
			it('should return "true" if user has HOMEWORK_EDIT and HOMEWORK_VIEW permission', () => {
				role = roleFactory.build({ permissions: [homeworkEdit, homeworkView] });
				const notCreator = userFactory.build({ roles: [role] });
				const task = taskFactory.build();
				entity = taskCardFactory.build({ task });
				const spy = jest.spyOn(taskRule, 'hasPermission').mockReturnValue(true);
				const res = service.hasPermission(notCreator, entity, { action: Actions.read, requiredPermissions: [] });
				expect(res).toBe(true);
				spy.mockRestore();
			});

			it('should return "true" if user has HOMEWORK_VIEW permission', () => {
				role = roleFactory.build({ permissions: [homeworkView] });
				const notCreator = userFactory.build({ roles: [role] });
				const task = taskFactory.build();
				entity = taskCardFactory.build({ task });
				const spy = jest.spyOn(taskRule, 'hasPermission').mockReturnValue(true);
				const res = service.hasPermission(notCreator, entity, { action: Actions.read, requiredPermissions: [] });
				expect(res).toBe(true);
				spy.mockRestore();
			});

			it('should return "false" if user does not have HOMEWORK_VIEW or HOMEWORK_EDIT permission', () => {
				role = roleFactory.build({ permissions: [] });
				const notCreator = userFactory.build({ roles: [role] });
				const task = taskFactory.build();
				entity = taskCardFactory.build({ task });
				const spy = jest.spyOn(taskRule, 'hasPermission').mockReturnValue(false);
				const res = service.hasPermission(notCreator, entity, { action: Actions.read, requiredPermissions: [] });
				expect(res).toBe(false);
				spy.mockRestore();
			});

			it('should return "false" if required permission is not met', () => {
				role = roleFactory.build({ permissions: [homeworkEdit, homeworkView] });
				const notCreator = userFactory.build({ roles: [role] });
				const task = taskFactory.build();
				entity = taskCardFactory.build({ task });
				const spy = jest.spyOn(taskRule, 'hasPermission').mockReturnValue(true);
				const res = service.hasPermission(notCreator, entity, {
					action: Actions.read,
					requiredPermissions: [Permission.TASK_CARD_VIEW],
				});
				expect(res).toBe(false);
				spy.mockRestore();
			});
		});

		describe('Access via write action', () => {
			it('should return "true" if user has HOMEWORK_EDIT and HOMEWORK_VIEW permission', () => {
				role = roleFactory.build({ permissions: [homeworkEdit, homeworkView] });
				const notCreator = userFactory.build({ roles: [role] });
				const task = taskFactory.build();
				entity = taskCardFactory.build({ task });
				const spy = jest.spyOn(taskRule, 'hasPermission').mockReturnValue(true);
				const res = service.hasPermission(notCreator, entity, { action: Actions.write, requiredPermissions: [] });
				expect(res).toBe(true);
				spy.mockRestore();
			});

			it('should return "false" if user has HOMEWORK_VIEW permission', () => {
				role = roleFactory.build({ permissions: [homeworkView] });
				const notCreator = userFactory.build({ roles: [role] });
				const task = taskFactory.build();
				entity = taskCardFactory.build({ task });
				const spy = jest.spyOn(taskRule, 'hasPermission').mockReturnValue(false);
				const res = service.hasPermission(notCreator, entity, { action: Actions.write, requiredPermissions: [] });
				expect(res).toBe(false);
				spy.mockRestore();
			});

			it('should return "false" if user does not have HOMEWORK_VIEW or HOMEWORK_EDIT permission', () => {
				role = roleFactory.build({ permissions: [] });
				const notCreator = userFactory.build({ roles: [role] });
				const task = taskFactory.build();
				entity = taskCardFactory.build({ task });
				const spy = jest.spyOn(taskRule, 'hasPermission').mockReturnValue(false);
				const res = service.hasPermission(notCreator, entity, { action: Actions.write, requiredPermissions: [] });
				expect(res).toBe(false);
				spy.mockRestore();
			});

			it('should return "false" if required permission is not met', () => {
				role = roleFactory.build({ permissions: [homeworkEdit, homeworkView] });
				const notCreator = userFactory.build({ roles: [role] });
				const task = taskFactory.build();
				entity = taskCardFactory.build({ task });
				const spy = jest.spyOn(taskRule, 'hasPermission').mockReturnValue(true);
				const res = service.hasPermission(notCreator, entity, {
					action: Actions.write,
					requiredPermissions: [Permission.TASK_CARD_VIEW],
				});
				expect(res).toBe(false);
				spy.mockRestore();
			});
		});
	});
});
