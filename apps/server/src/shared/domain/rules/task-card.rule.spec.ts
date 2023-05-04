import { DeepPartial } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, TaskCard, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { roleFactory, setupEntities, taskCardFactory, taskFactory, userFactory } from '@shared/testing';
import { CourseGroupRule, CourseRule, LessonRule, TaskCardRule, TaskRule } from '.';
import { AuthorizationHelper } from '../../../modules/authorization/authorization.helper';
import { Action } from '../../../modules/authorization/types';

describe('TaskCardRule', () => {
	let service: TaskCardRule;
	let authorizationHelper: AuthorizationHelper;
	let taskRule: DeepPartial<TaskRule>;
	let role: Role;
	let user: User;
	let entity: TaskCard;
	const homeworkEdit = Permission.HOMEWORK_EDIT;
	const homeworkView = Permission.HOMEWORK_VIEW;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthorizationHelper, TaskCardRule, TaskRule, CourseRule, LessonRule, CourseGroupRule],
		}).compile();

		service = await module.get(TaskCardRule);
		authorizationHelper = await module.get(AuthorizationHelper);
		taskRule = await module.get(TaskRule);
	});

	beforeEach(() => {
		role = roleFactory.build({ permissions: [homeworkEdit, homeworkView] });
		user = userFactory.build({ roles: [role] });
	});

	it('should call hasAllPermissions on AuthorizationHelper', () => {
		entity = taskCardFactory.build({ creator: user });
		const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');
		service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, []);
	});

	it('should call hasAccessToEntity on AuthorizationHelper', () => {
		entity = taskCardFactory.build({ creator: user });
		const spy = jest.spyOn(authorizationHelper, 'hasAccessToEntity');
		service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, entity, ['creator']);
	});

	it('should call hasPermission on TaskRule', () => {
		const task = taskFactory.build({ creator: user });
		entity = taskCardFactory.build({ task });
		const spy = jest.spyOn(taskRule, 'hasPermission');
		service.hasPermission(user, entity, { action: Action.write, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, entity.task, { action: Action.write, requiredPermissions: [homeworkEdit] });
	});

	describe('User is creator of the task card', () => {
		describe('Access via read action', () => {
			it('should return "true" if user has HOMEWORK_EDIT and HOMEWORK_VIEW permission', () => {
				role = roleFactory.build({ permissions: [homeworkEdit, homeworkView] });
				const creator = userFactory.build({ roles: [role] });
				const task = taskFactory.build({ creator });
				entity = taskCardFactory.build({ creator, task });
				const res = service.hasPermission(creator, entity, { action: Action.read, requiredPermissions: [] });
				expect(res).toBe(true);
			});

			it('should return "true" if user has HOMEWORK_VIEW permission', () => {
				role = roleFactory.build({ permissions: [homeworkView] });
				const creator = userFactory.build({ roles: [role] });
				const task = taskFactory.build({ creator });
				entity = taskCardFactory.build({ creator, task });
				const res = service.hasPermission(creator, entity, { action: Action.read, requiredPermissions: [] });
				expect(res).toBe(true);
			});

			it('should return "true" if user does not have HOMEWORK_VIEW or HOMEWORK_EDIT permission', () => {
				role = roleFactory.build({ permissions: [] });
				const creator = userFactory.build({ roles: [role] });
				const task = taskFactory.build({ creator });
				entity = taskCardFactory.build({ creator, task });
				const res = service.hasPermission(creator, entity, { action: Action.read, requiredPermissions: [] });
				expect(res).toBe(true);
			});

			it('should return "false" if required permission is not met', () => {
				role = roleFactory.build({ permissions: [homeworkEdit, homeworkView] });
				const creator = userFactory.build({ roles: [role] });
				const task = taskFactory.build({ creator });
				entity = taskCardFactory.build({ creator, task });
				const res = service.hasPermission(creator, entity, {
					action: Action.read,
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
				const res = service.hasPermission(creator, entity, { action: Action.write, requiredPermissions: [] });
				expect(res).toBe(true);
			});

			it('should return "true" if user has HOMEWORK_VIEW permission', () => {
				role = roleFactory.build({ permissions: [homeworkView] });
				const creator = userFactory.build({ roles: [role] });
				const task = taskFactory.build({ creator });
				entity = taskCardFactory.build({ creator, task });
				const res = service.hasPermission(creator, entity, { action: Action.write, requiredPermissions: [] });
				expect(res).toBe(true);
			});

			it('should return "true" if user does not have HOMEWORK_VIEW or HOMEWORK_EDIT permission', () => {
				role = roleFactory.build({ permissions: [] });
				const creator = userFactory.build({ roles: [role] });
				const task = taskFactory.build({ creator });
				entity = taskCardFactory.build({ creator, task });
				const res = service.hasPermission(creator, entity, { action: Action.write, requiredPermissions: [] });
				expect(res).toBe(true);
			});

			it('should return "false" if required permission is not met', () => {
				role = roleFactory.build({ permissions: [homeworkEdit, homeworkView] });
				const creator = userFactory.build({ roles: [role] });
				const task = taskFactory.build({ creator });
				entity = taskCardFactory.build({ creator, task });
				const res = service.hasPermission(creator, entity, {
					action: Action.write,
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
				const res = service.hasPermission(notCreator, entity, { action: Action.read, requiredPermissions: [] });
				expect(res).toBe(true);
				spy.mockRestore();
			});

			it('should return "true" if user has HOMEWORK_VIEW permission', () => {
				role = roleFactory.build({ permissions: [homeworkView] });
				const notCreator = userFactory.build({ roles: [role] });
				const task = taskFactory.build();
				entity = taskCardFactory.build({ task });
				const spy = jest.spyOn(taskRule, 'hasPermission').mockReturnValue(true);
				const res = service.hasPermission(notCreator, entity, { action: Action.read, requiredPermissions: [] });
				expect(res).toBe(true);
				spy.mockRestore();
			});

			it('should return "false" if user does not have HOMEWORK_VIEW or HOMEWORK_EDIT permission', () => {
				role = roleFactory.build({ permissions: [] });
				const notCreator = userFactory.build({ roles: [role] });
				const task = taskFactory.build();
				entity = taskCardFactory.build({ task });
				const spy = jest.spyOn(taskRule, 'hasPermission').mockReturnValue(false);
				const res = service.hasPermission(notCreator, entity, { action: Action.read, requiredPermissions: [] });
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
					action: Action.read,
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
				const res = service.hasPermission(notCreator, entity, { action: Action.write, requiredPermissions: [] });
				expect(res).toBe(true);
				spy.mockRestore();
			});

			it('should return "false" if user has HOMEWORK_VIEW permission', () => {
				role = roleFactory.build({ permissions: [homeworkView] });
				const notCreator = userFactory.build({ roles: [role] });
				const task = taskFactory.build();
				entity = taskCardFactory.build({ task });
				const spy = jest.spyOn(taskRule, 'hasPermission').mockReturnValue(false);
				const res = service.hasPermission(notCreator, entity, { action: Action.write, requiredPermissions: [] });
				expect(res).toBe(false);
				spy.mockRestore();
			});

			it('should return "false" if user does not have HOMEWORK_VIEW or HOMEWORK_EDIT permission', () => {
				role = roleFactory.build({ permissions: [] });
				const notCreator = userFactory.build({ roles: [role] });
				const task = taskFactory.build();
				entity = taskCardFactory.build({ task });
				const spy = jest.spyOn(taskRule, 'hasPermission').mockReturnValue(false);
				const res = service.hasPermission(notCreator, entity, { action: Action.write, requiredPermissions: [] });
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
					action: Action.write,
					requiredPermissions: [Permission.TASK_CARD_VIEW],
				});
				expect(res).toBe(false);
				spy.mockRestore();
			});
		});
	});
});
