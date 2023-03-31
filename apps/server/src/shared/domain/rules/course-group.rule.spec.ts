import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, courseGroupFactory, roleFactory, setupEntities, userFactory } from '@shared/testing';
import { CourseGroup, User } from '../entity';
import { Permission } from '../interface';
import { Actions } from './actions.enum';
import { AuthorizationHelper } from './authorization.helper';
import { CourseGroupRule } from './course-group.rule';
import { CourseRule } from './course.rule';

describe('CourseGroupRule', () => {
	let service: CourseGroupRule;
	let authorizationHelper: AuthorizationHelper;
	let courseRule: CourseRule;
	let user: User;
	let entity: CourseGroup;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthorizationHelper, CourseRule, CourseGroupRule],
		}).compile();

		service = await module.get(CourseGroupRule);
		authorizationHelper = await module.get(AuthorizationHelper);
		courseRule = await module.get(CourseRule);
		const role = roleFactory.build({ permissions: [permissionA, permissionB] });
		user = userFactory.build({ roles: [role] });
	});

	it('should call hasAllPermissions on AuthorizationHelper', () => {
		const course = courseFactory.build({ teachers: [user] });
		entity = courseGroupFactory.build({ course });
		const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');
		service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, []);
	});

	describe('Action.read', () => {
		it('should call hasAccessToEntity on AuthorizationHelper', () => {
			const course = courseFactory.build({ teachers: [user] });
			entity = courseGroupFactory.build({ course });
			const spy = jest.spyOn(authorizationHelper, 'hasAccessToEntity');
			service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
			expect(spy).toBeCalledWith(user, entity, ['students']);
		});

		it('should call courseRule.hasPermission', () => {
			const course = courseFactory.build({ teachers: [user] });
			entity = courseGroupFactory.build({ course });
			const spy = jest.spyOn(courseRule, 'hasPermission');
			service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
			expect(spy).toBeCalledWith(user, entity.course, { action: Actions.write, requiredPermissions: [] });
		});
	});

	describe('Action.write', () => {
		it('should call hasAccessToEntity on AuthorizationHelper', () => {
			const course = courseFactory.build({ teachers: [user] });
			entity = courseGroupFactory.build({ course });
			const spy = jest.spyOn(authorizationHelper, 'hasAccessToEntity');
			service.hasPermission(user, entity, { action: Actions.write, requiredPermissions: [] });
			expect(spy).toBeCalledWith(user, entity, ['students']);
		});

		it('should call courseRule.hasPermission', () => {
			const course = courseFactory.build({ teachers: [user] });
			entity = courseGroupFactory.build({ course });
			const spy = jest.spyOn(courseRule, 'hasPermission');
			service.hasPermission(user, entity, { action: Actions.write, requiredPermissions: [] });
			expect(spy).toBeCalledWith(user, entity.course, { action: Actions.write, requiredPermissions: [] });
		});
	});

	describe('User [TEACHER]', () => {
		describe('with passed permissions', () => {
			it('should return "true" if user in scope', () => {
				const course = courseFactory.build({ teachers: [user] });
				entity = courseGroupFactory.build({ course, students: [] });
				const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
				expect(res).toBe(true);
			});
		});

		describe('without permission', () => {
			it('should return "false" if user has not permission', () => {
				const course = courseFactory.build({ teachers: [user] });
				entity = courseGroupFactory.build({ course });
				const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [permissionC] });
				expect(res).toBe(false);
			});

			it('should return "false" if user has not access to entity', () => {
				entity = courseGroupFactory.build();
				const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [permissionA] });
				expect(res).toBe(false);
			});
		});
	});

	describe('User [STUDENT]', () => {
		describe('with passed permissions', () => {
			it('should return "true" if user in scope', () => {
				const course = courseFactory.build({ students: [] });
				entity = courseGroupFactory.build({ course, students: [user] });
				const res = service.hasPermission(user, entity, { action: Actions.read, requiredPermissions: [] });
				expect(res).toBe(true);
			});
		});

		describe('without permission', () => {
			it('should return "false" if user has not permission', () => {
				const course = courseFactory.build({ students: [] });
				entity = courseGroupFactory.build({ course, students: [user] });
				const res = service.hasPermission(user, entity, { action: Actions.write, requiredPermissions: [permissionC] });
				expect(res).toBe(false);
			});

			it('should return "false" if user has not access to entity', () => {
				const course = courseFactory.build({ students: [user] });
				entity = courseGroupFactory.build({ course, students: [] });
				const res = service.hasPermission(user, entity, { action: Actions.write, requiredPermissions: [permissionA] });
				expect(res).toBe(false);
			});
		});
	});
});
