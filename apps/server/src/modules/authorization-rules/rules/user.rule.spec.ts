import { Action, AuthorizationHelper, AuthorizationInjectionService } from '@modules/authorization';
import { roleFactory } from '@modules/role/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { User } from '@modules/user/repo';
import { userDoFactory, userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { UserRule } from './user.rule';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';

describe('UserRule', () => {
	let service: UserRule;
	let authorizationHelper: AuthorizationHelper;
	let injectionService: AuthorizationInjectionService;
	let configServiceMock: DeepMocked<ConfigService>;

	const grantedPermission = 'a' as Permission;
	const deniedPermission = 'c' as Permission;

	beforeAll(async () => {
		await setupEntities([User]);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthorizationHelper,
				UserRule,
				AuthorizationInjectionService,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		service = await module.get(UserRule);
		authorizationHelper = await module.get(AuthorizationHelper);
		injectionService = await module.get(AuthorizationInjectionService);
		configServiceMock = module.get(ConfigService);
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
		const entity = userDoFactory.buildWithId();
		const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');
		service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, []);
	});

	describe('when a user accesses himself', () => {
		const setup = () => {
			const role = roleFactory.buildWithId({ permissions: [grantedPermission] });
			const school = schoolEntityFactory.buildWithId();
			const user = userFactory.buildWithId({ roles: [role], school });
			const entity = userDoFactory.buildWithId({ id: user.id, schoolId: school.id });
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
			const entity = userDoFactory.buildWithId({ schoolId: school.id });
			return { user, entity, school };
		};

		it('should return "true" if user has the permissions', () => {
			const { user, entity } = setup();
			const res = service.hasPermission(user, entity, {
				action: Action.read,
				requiredPermissions: [grantedPermission],
			});
			expect(res).toBe(true);
		});

		it('should return "false" if user has not permission', () => {
			const { user, entity } = setup();
			const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [deniedPermission] });
			expect(res).toBe(false);
		});
	});

	describe('when accessing a user of another school', () => {
		const setup = (isDiscoverable = false) => {
			const role = roleFactory.buildWithId({ permissions: [grantedPermission] });
			const userSchool = schoolEntityFactory.buildWithId();
			const entitySchool = schoolEntityFactory.buildWithId();
			const user = userFactory.buildWithId({ roles: [role], school: userSchool });
			const entity = userDoFactory.buildWithId({ schoolId: entitySchool.id, discoverable: isDiscoverable });
			return { user, entity, school: userSchool };
		};

		it('should return "true" if user has the permissions, and entity is discoverable', () => {
			const { user, entity } = setup(true);
			const res = service.hasPermission(user, entity, {
				action: Action.read,
				requiredPermissions: [grantedPermission],
			});
			expect(res).toBe(true);
		});

		it('should return "false" if entity is discoverable, but user does not have the permissions', () => {
			const { user, entity } = setup(true);
			const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [deniedPermission] });
			expect(res).toBe(false);
		});

		it('should return "false" if user has the permission, but entity is not discoverable', () => {
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

	describe('discoverability setting', () => {
		describe.each([
			{ systemSetting: 'enabled', userSetting: undefined, discoverable: true },
			{ systemSetting: 'enabled', userSetting: true, discoverable: true },
			{ systemSetting: 'opt-in', userSetting: undefined, discoverable: false },
			{ systemSetting: 'opt-in', userSetting: true, discoverable: true },
			{ systemSetting: 'opt-out', userSetting: undefined, discoverable: false },
			{ systemSetting: 'opt-out', userSetting: true, discoverable: true },
			{ systemSetting: 'disabled', userSetting: undefined, discoverable: false },
			{ systemSetting: 'disabled', userSetting: true, discoverable: false },
		])(
			"when discoverability system setting is '$systemSetting' and user-setting is '$userSetting'",
			({ systemSetting, userSetting, discoverable }) => {
				it(`should return ${discoverable === true ? 'true' : 'false'}`, () => {
					configServiceMock.get.mockReturnValue(systemSetting);

					const role = roleFactory.buildWithId({ permissions: [grantedPermission] });
					const userSchool = schoolEntityFactory.buildWithId();
					const user = userFactory.buildWithId({ roles: [role], school: userSchool });

					const entitySchool = schoolEntityFactory.buildWithId();
					const userEntity = userDoFactory.buildWithId({ schoolId: entitySchool.id, discoverable: userSetting });

					const res = service.hasPermission(user, userEntity, {
						action: Action.read,
						requiredPermissions: [grantedPermission],
					});
					expect(res).toBe(discoverable);
				});
			}
		);
	});
});
