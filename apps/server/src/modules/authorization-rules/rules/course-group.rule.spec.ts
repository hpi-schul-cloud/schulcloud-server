import {
	Action,
	AUTHORIZATION_CONFIG_TOKEN,
	AuthorizationHelper,
	AuthorizationInjectionService,
} from '@modules/authorization';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory, courseGroupEntityFactory } from '@modules/course/testing';
import { roleFactory } from '@modules/role/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { CourseGroupRule } from './course-group.rule';
import { CourseRule } from './course.rule';

describe('CourseGroupRule', () => {
	let service: CourseGroupRule;
	let authorizationHelper: AuthorizationHelper;
	let injectionService: AuthorizationInjectionService;
	let courseRule: CourseRule;
	let user: User;
	let entity: CourseGroupEntity;
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	beforeAll(async () => {
		await setupEntities([User, CourseEntity, CourseGroupEntity]);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthorizationHelper,
				CourseRule,
				CourseGroupRule,
				AuthorizationInjectionService,
				{ provide: AUTHORIZATION_CONFIG_TOKEN, useValue: {} },
			],
		}).compile();

		service = await module.get(CourseGroupRule);
		authorizationHelper = await module.get(AuthorizationHelper);
		injectionService = await module.get(AuthorizationInjectionService);
		courseRule = await module.get(CourseRule);
		const role = roleFactory.build({ permissions: [permissionA, permissionB] });
		user = userFactory.build({ roles: [role] });
	});

	it('should call hasAllPermissions on AuthorizationHelper', () => {
		const course = courseEntityFactory.build({ teachers: [user] });
		entity = courseGroupEntityFactory.build({ course });
		const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');
		service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, []);
	});

	describe('constructor', () => {
		it('should inject into AuthorizationInjectionService', () => {
			expect(injectionService.getAuthorizationRules()).toContain(service);
		});
	});

	describe('Action.read', () => {
		it('should call hasAccessToEntity on AuthorizationHelper', () => {
			const course = courseEntityFactory.build({ teachers: [user] });
			entity = courseGroupEntityFactory.build({ course });
			const spy = jest.spyOn(authorizationHelper, 'hasAccessToEntity');
			service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
			expect(spy).toBeCalledWith(user, entity, ['students']);
		});

		it('should call courseRule.hasPermission', () => {
			const course = courseEntityFactory.build({ teachers: [user] });
			entity = courseGroupEntityFactory.build({ course });
			const spy = jest.spyOn(courseRule, 'hasPermission');
			service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
			expect(spy).toBeCalledWith(user, entity.course, { action: Action.write, requiredPermissions: [] });
		});
	});

	describe('Action.write', () => {
		it('should call hasAccessToEntity on AuthorizationHelper', () => {
			const course = courseEntityFactory.build({ teachers: [user] });
			entity = courseGroupEntityFactory.build({ course });
			const spy = jest.spyOn(authorizationHelper, 'hasAccessToEntity');
			service.hasPermission(user, entity, { action: Action.write, requiredPermissions: [] });
			expect(spy).toBeCalledWith(user, entity, ['students']);
		});

		it('should call courseRule.hasPermission', () => {
			const course = courseEntityFactory.build({ teachers: [user] });
			entity = courseGroupEntityFactory.build({ course });
			const spy = jest.spyOn(courseRule, 'hasPermission');
			service.hasPermission(user, entity, { action: Action.write, requiredPermissions: [] });
			expect(spy).toBeCalledWith(user, entity.course, { action: Action.write, requiredPermissions: [] });
		});
	});

	describe('User [TEACHER]', () => {
		describe('with passed permissions', () => {
			it('should return "true" if user in scope', () => {
				const course = courseEntityFactory.build({ teachers: [user] });
				entity = courseGroupEntityFactory.build({ course, students: [] });
				const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
				expect(res).toBe(true);
			});
		});

		describe('without permission', () => {
			it('should return "false" if user has not permission', () => {
				const course = courseEntityFactory.build({ teachers: [user] });
				entity = courseGroupEntityFactory.build({ course });
				const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [permissionC] });
				expect(res).toBe(false);
			});

			it('should return "false" if user has not access to entity', () => {
				entity = courseGroupEntityFactory.build();
				const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [permissionA] });
				expect(res).toBe(false);
			});
		});
	});

	describe('User [STUDENT]', () => {
		describe('with passed permissions', () => {
			it('should return "true" if user in scope', () => {
				const course = courseEntityFactory.build({ students: [] });
				entity = courseGroupEntityFactory.build({ course, students: [user] });
				const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
				expect(res).toBe(true);
			});
		});

		describe('without permission', () => {
			it('should return "false" if user has not permission', () => {
				const course = courseEntityFactory.build({ students: [] });
				entity = courseGroupEntityFactory.build({ course, students: [user] });
				const res = service.hasPermission(user, entity, { action: Action.write, requiredPermissions: [permissionC] });
				expect(res).toBe(false);
			});

			it('should return "false" if user has not access to entity', () => {
				const course = courseEntityFactory.build({ students: [user] });
				entity = courseGroupEntityFactory.build({ course, students: [] });
				const res = service.hasPermission(user, entity, { action: Action.write, requiredPermissions: [permissionA] });
				expect(res).toBe(false);
			});
		});
	});
});
