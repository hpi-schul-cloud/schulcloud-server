import { ObjectId } from '@mikro-orm/mongodb';
import {
	Action,
	AUTHORIZATION_CONFIG_TOKEN,
	AuthorizationHelper,
	AuthorizationInjectionService,
} from '@modules/authorization';
import { legacySchoolDoFactory } from '@modules/legacy-school/testing';
import { roleFactory } from '@modules/role/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { LegacySchoolRule } from './legacy-school.rule';

const createSchoolAndUserWithPermissions = () => {
	const permissionA = 'a' as Permission;
	const permissionB = 'b' as Permission;
	const permissionC = 'c' as Permission;

	const school = legacySchoolDoFactory.build({ id: new ObjectId().toString() });
	const role = roleFactory.build({ permissions: [permissionA, permissionB] });
	const user = userFactory.build({
		roles: [role],
		school: { id: school.id },
	});

	return { school, user, permissionA, permissionB, permissionC };
};

describe('LegacySchoolRule', () => {
	let service: LegacySchoolRule;
	let authorizationHelper: AuthorizationHelper;
	let injectionService: AuthorizationInjectionService;

	beforeAll(async () => {
		await setupEntities([User]);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthorizationHelper,
				LegacySchoolRule,
				AuthorizationInjectionService,
				{ provide: AUTHORIZATION_CONFIG_TOKEN, useValue: {} },
			],
		}).compile();

		service = await module.get(LegacySchoolRule);
		authorizationHelper = await module.get(AuthorizationHelper);
		injectionService = await module.get(AuthorizationInjectionService);
	});

	describe('constructor', () => {
		it('should inject into AuthorizationInjectionService', () => {
			expect(injectionService.getAuthorizationRules()).toContain(service);
		});
	});

	describe('hasPermission', () => {
		describe('when calling hasAllPermissions', () => {
			const setup = () => {
				const { school, user } = createSchoolAndUserWithPermissions();
				const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');

				return { school, user, spy };
			};

			it('should call hasAllPermissions on AuthorizationHelper', () => {
				const { school, user, spy } = setup();

				service.hasPermission(user, school, { action: Action.read, requiredPermissions: [] });

				expect(spy).toBeCalledWith(user, []);
			});
		});

		describe('when user is in scope', () => {
			const setup = () => {
				const { school, user } = createSchoolAndUserWithPermissions();

				return { school, user };
			};

			it('should return "true"', () => {
				const { school, user } = setup();

				const res = service.hasPermission(user, school, { action: Action.read, requiredPermissions: [] });

				expect(res).toBe(true);
			});
		});

		describe('when user has not permission', () => {
			const setup = () => {
				const { school, user, permissionC } = createSchoolAndUserWithPermissions();

				return { school, user, permissionC };
			};

			it('should return "false"', () => {
				const { school, user, permissionC } = setup();

				const res = service.hasPermission(user, school, { action: Action.read, requiredPermissions: [permissionC] });

				expect(res).toBe(false);
			});
		});

		describe('when user has not same school', () => {
			const setup = () => {
				const { user, permissionA } = createSchoolAndUserWithPermissions();
				const school = legacySchoolDoFactory.build();

				return { school, user, permissionA };
			};

			it('should return "false"', () => {
				const { school, user, permissionA } = setup();

				const res = service.hasPermission(user, school, { action: Action.read, requiredPermissions: [permissionA] });

				expect(res).toBe(false);
			});
		});

		describe('when user has CAN_EXECUTE_INSTANCE_OPERATIONS permission', () => {
			describe('when user has instance operation permission with SCHOOL_VIEW for read action', () => {
				const setup = () => {
					const school = legacySchoolDoFactory.build({ id: new ObjectId().toString() });
					const role = roleFactory.build({
						permissions: [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS, Permission.SCHOOL_VIEW],
					});
					const user = userFactory.build({
						roles: [role],
						school: { id: new ObjectId().toString() },
					});

					return { school, user };
				};

				it('should return "true" even without being at the same school', () => {
					const { school, user } = setup();

					const res = service.hasPermission(user, school, { action: Action.read, requiredPermissions: [] });

					expect(res).toBe(true);
				});
			});

			describe('when user has instance operation permission with SCHOOL_VIEW for write action', () => {
				const setup = () => {
					const school = legacySchoolDoFactory.build({ id: new ObjectId().toString() });
					const role = roleFactory.build({
						permissions: [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS, Permission.SCHOOL_VIEW],
					});
					const user = userFactory.build({
						roles: [role],
						school: { id: new ObjectId().toString() },
					});

					return { school, user };
				};

				it('should return "true" even without being at the same school', () => {
					const { school, user } = setup();

					const res = service.hasPermission(user, school, { action: Action.write, requiredPermissions: [] });

					expect(res).toBe(true);
				});
			});

			describe('when user has instance operation permission but missing required permissions', () => {
				const setup = () => {
					const school = legacySchoolDoFactory.build({ id: new ObjectId().toString() });
					const role = roleFactory.build({
						permissions: [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS, Permission.SCHOOL_VIEW],
					});
					const user = userFactory.build({
						roles: [role],
						school: { id: new ObjectId().toString() },
					});
					const missingPermission = 'missing' as Permission;

					return { school, user, missingPermission };
				};

				it('should return "false" when required permissions are not met', () => {
					const { school, user, missingPermission } = setup();

					const res = service.hasPermission(user, school, {
						action: Action.read,
						requiredPermissions: [missingPermission],
					});

					expect(res).toBe(false);
				});
			});

			describe('when user has only CAN_EXECUTE_INSTANCE_OPERATIONS without SCHOOL_VIEW', () => {
				const setup = () => {
					const school = legacySchoolDoFactory.build({ id: new ObjectId().toString() });
					const role = roleFactory.build({
						permissions: [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS],
					});
					const user = userFactory.build({
						roles: [role],
						school: { id: new ObjectId().toString() },
					});

					return { school, user };
				};

				it('should return "false" for read action', () => {
					const { school, user } = setup();

					const res = service.hasPermission(user, school, { action: Action.read, requiredPermissions: [] });

					expect(res).toBe(false);
				});
			});
		});
	});
});
