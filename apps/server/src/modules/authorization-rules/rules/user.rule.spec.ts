import {
	Action,
	AUTHORIZATION_CONFIG_TOKEN,
	AuthorizationConfig,
	AuthorizationHelper,
	AuthorizationInjectionService,
	TeacherVisibilityForExternalTeamInvitation,
} from '@modules/authorization';
import { roleFactory } from '@modules/role/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { User } from '@modules/user/repo';
import { userDoFactory, userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { UserRule } from './user.rule';

describe('UserRule', () => {
	let service: UserRule;
	let authorizationHelper: AuthorizationHelper;
	let injectionService: AuthorizationInjectionService;
	let config: AuthorizationConfig;

	const grantedPermission = 'a' as Permission;
	const deniedPermission = 'c' as Permission;

	beforeAll(async () => {
		await setupEntities([User]);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthorizationHelper,
				UserRule,
				AuthorizationInjectionService,
				{ provide: AUTHORIZATION_CONFIG_TOKEN, useValue: {} },
			],
		}).compile();

		service = await module.get(UserRule);
		authorizationHelper = await module.get(AuthorizationHelper);
		injectionService = await module.get(AuthorizationInjectionService);
		config = await module.get(AUTHORIZATION_CONFIG_TOKEN);
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
		config.teacherVisibilityForExternalTeamInvitation = TeacherVisibilityForExternalTeamInvitation.OPT_IN;

		service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });
		expect(spy).toBeCalledWith(user, []);
	});

	describe('when a user accesses himself', () => {
		const setup = () => {
			config.teacherVisibilityForExternalTeamInvitation = TeacherVisibilityForExternalTeamInvitation.OPT_IN;
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
			config.teacherVisibilityForExternalTeamInvitation = TeacherVisibilityForExternalTeamInvitation.OPT_IN;
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
			{ systemSetting: TeacherVisibilityForExternalTeamInvitation.ENABLED, userSetting: undefined, discoverable: true },
			{ systemSetting: TeacherVisibilityForExternalTeamInvitation.ENABLED, userSetting: true, discoverable: true },
			{ systemSetting: TeacherVisibilityForExternalTeamInvitation.ENABLED, userSetting: false, discoverable: true },
			{ systemSetting: TeacherVisibilityForExternalTeamInvitation.OPT_IN, userSetting: undefined, discoverable: false },
			{ systemSetting: TeacherVisibilityForExternalTeamInvitation.OPT_IN, userSetting: true, discoverable: true },
			{ systemSetting: TeacherVisibilityForExternalTeamInvitation.OPT_IN, userSetting: false, discoverable: false },
			{ systemSetting: TeacherVisibilityForExternalTeamInvitation.OPT_OUT, userSetting: undefined, discoverable: true },
			{ systemSetting: TeacherVisibilityForExternalTeamInvitation.OPT_OUT, userSetting: true, discoverable: true },
			{ systemSetting: TeacherVisibilityForExternalTeamInvitation.OPT_OUT, userSetting: false, discoverable: false },
			{
				systemSetting: TeacherVisibilityForExternalTeamInvitation.DISABLED,
				userSetting: undefined,
				discoverable: false,
			},
			{ systemSetting: TeacherVisibilityForExternalTeamInvitation.DISABLED, userSetting: true, discoverable: false },
			{ systemSetting: TeacherVisibilityForExternalTeamInvitation.DISABLED, userSetting: false, discoverable: false },
		])(
			"when discoverability system setting is '$systemSetting' and user-setting is '$userSetting'",
			({ systemSetting, userSetting, discoverable }) => {
				it(`should return ${discoverable === true ? 'true' : 'false'}`, () => {
					config.teacherVisibilityForExternalTeamInvitation = systemSetting;

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

		describe('when discoverability system setting is an unknown value', () => {
			it('should throw an error', () => {
				config.teacherVisibilityForExternalTeamInvitation =
					'unknown-value' as TeacherVisibilityForExternalTeamInvitation;

				const role = roleFactory.buildWithId({ permissions: [grantedPermission] });
				const userSchool = schoolEntityFactory.buildWithId();
				const user = userFactory.buildWithId({ roles: [role], school: userSchool });

				const entitySchool = schoolEntityFactory.buildWithId();
				const userEntity = userDoFactory.buildWithId({ schoolId: entitySchool.id });

				expect(() =>
					service.hasPermission(user, userEntity, {
						action: Action.read,
						requiredPermissions: [grantedPermission],
					})
				).toThrowError('Invalid discoverability setting');
			});
		});
	});
});
