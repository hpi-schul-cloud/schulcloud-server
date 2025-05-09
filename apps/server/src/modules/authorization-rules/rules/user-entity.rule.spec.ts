import { Action, AuthorizationHelper, AuthorizationInjectionService } from '@modules/authorization';
import { roleFactory } from '@modules/role/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { UserEntityRule } from './user-entity.rule';

describe('UserRule', () => {
	let service: UserEntityRule;
	let authorizationHelper: AuthorizationHelper;
	let injectionService: AuthorizationInjectionService;
	const grantedPermission = 'a' as Permission;
	const deniedPermission = 'c' as Permission;

	beforeAll(async () => {
		await setupEntities([User]);

		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthorizationHelper, UserEntityRule, AuthorizationInjectionService],
		}).compile();

		service = await module.get(UserEntityRule);
		authorizationHelper = await module.get(AuthorizationHelper);
		injectionService = await module.get(AuthorizationInjectionService);
	});

	describe('constructor', () => {
		it('should inject into AuthorizationInjectionService', () => {
			expect(injectionService.getAuthorizationRules()).toContain(service);
		});
	});

	it('should call hasAllPermissions on AuthorizationHelper', () => {
		const role = roleFactory.buildWithId({ permissions: [grantedPermission] });
		const school = schoolEntityFactory.buildWithId();
		const user = userFactory.buildWithId({ roles: [role], school });
		const entity = userFactory.buildWithId();
		const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');
		service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, []);
	});

	describe('when a user accesses himself', () => {
		const setup = () => {
			const role = roleFactory.buildWithId({ permissions: [grantedPermission] });
			const school = schoolEntityFactory.buildWithId();
			const user = userFactory.buildWithId({ roles: [role], school });
			const entity = user;
			return { user, entity, school };
		};

		it('should return "true" if user accesses himself', () => {
			const { user, entity } = setup();
			const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
			expect(res).toBe(true);
		});

		it('should return "false" if user accesses himself but has not permission', () => {
			const { user, entity } = setup();
			const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [deniedPermission] });
			expect(res).toBe(false);
		});
	});

	describe('when accessing a user of the same school', () => {
		const setup = () => {
			const role = roleFactory.buildWithId({ permissions: [grantedPermission] });
			const school = schoolEntityFactory.buildWithId();
			const user = userFactory.buildWithId({ roles: [role], school });
			const entity = userFactory.buildWithId({ school });
			return { user, entity, school };
		};

		it('should return "false" even if user has the permissions', () => {
			const { user, entity } = setup();
			const res = service.hasPermission(user, entity, {
				action: Action.read,
				requiredPermissions: [grantedPermission],
			});
			expect(res).toBe(false);
		});

		it('should return "false" if user has not permission', () => {
			const { user, entity } = setup();
			const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [deniedPermission] });
			expect(res).toBe(false);
		});
	});
});
