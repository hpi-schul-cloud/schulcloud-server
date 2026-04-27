import { DeepMocked, createMock } from '@golevelup/ts-jest';
import {
	Action,
	AUTHORIZATION_CONFIG_TOKEN,
	AuthorizationHelper,
	AuthorizationInjectionService,
} from '@modules/authorization';
import { roleFactory } from '@modules/role/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { schoolExternalToolEntityFactory, schoolExternalToolFactory } from '../testing';
import { SchoolExternalToolRule } from './school-external-tool.rule';

describe('SchoolExternalToolRule', () => {
	let service: SchoolExternalToolRule;
	let authorizationHelper: AuthorizationHelper;
	let injectionService: DeepMocked<AuthorizationInjectionService>;

	beforeAll(async () => {
		await setupEntities([User]);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthorizationHelper,
				SchoolExternalToolRule,
				{
					provide: AuthorizationInjectionService,
					useValue: createMock<AuthorizationInjectionService>(),
				},
				{ provide: AUTHORIZATION_CONFIG_TOKEN, useValue: {} },
			],
		}).compile();

		service = await module.get(SchoolExternalToolRule);
		authorizationHelper = await module.get(AuthorizationHelper);
		injectionService = await module.get(AuthorizationInjectionService);
	});

	beforeEach(() => {});

	describe('constructor', () => {
		it('should inject itself', () => {
			expect(injectionService.injectAuthorizationRule).toHaveBeenCalledWith(service);
		});
	});

	describe('hasPermission is called', () => {
		describe('when user has permission', () => {
			const setup = () => {
				const permissionA = 'a' as Permission;
				const permissionB = 'b' as Permission;
				const role = roleFactory.build({ permissions: [permissionA, permissionB] });
				const school = schoolEntityFactory.build();
				const entity = schoolExternalToolEntityFactory.build();
				entity.school = school;
				const user = userFactory.build({ roles: [role], school });

				return { user, entity };
			};

			it('should call hasAllPermissions on AuthorizationHelper', () => {
				const { user, entity } = setup();
				const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');

				service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });

				expect(spy).toBeCalledWith(user, []);
			});

			it('should return "true" for read action if user in scope', () => {
				const { user, entity } = setup();

				const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });

				expect(res).toBe(true);
			});

			it('should return "true" for write action if user in scope', () => {
				const { user, entity } = setup();

				const res = service.hasPermission(user, entity, { action: Action.write, requiredPermissions: [] });

				expect(res).toBe(true);
			});
		});

		describe('when user has not permission', () => {
			const setup = () => {
				const permissionA = 'a' as Permission;
				const permissionB = 'b' as Permission;
				const permissionC = 'c' as Permission;
				const role = roleFactory.build({ permissions: [permissionA, permissionB] });
				const school = schoolEntityFactory.build();
				const entity = schoolExternalToolEntityFactory.build();
				entity.school = school;
				const user = userFactory.build({ roles: [role], school });

				return { user, entity, permissionA, permissionC, role };
			};

			it('should return "false" for read action if user has not permission', () => {
				const { user, entity, permissionC } = setup();

				const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [permissionC] });

				expect(res).toBe(false);
			});

			it('should return "false" for write action if user has not permission', () => {
				const { user, entity, permissionC } = setup();

				const res = service.hasPermission(user, entity, { action: Action.write, requiredPermissions: [permissionC] });

				expect(res).toBe(false);
			});

			it('should return "false" if user has not some school', () => {
				const { permissionA, role } = setup();
				const schoolExternalTool = schoolExternalToolFactory.build();
				const user = userFactory.build({ roles: [role] });

				const res = service.hasPermission(user, schoolExternalTool, {
					action: Action.read,
					requiredPermissions: [permissionA],
				});

				expect(res).toBe(false);
			});

			it('should return "false" for write action if user has not some school', () => {
				const { permissionA, role } = setup();
				const schoolExternalTool = schoolExternalToolFactory.build();
				const user = userFactory.build({ roles: [role] });

				const res = service.hasPermission(user, schoolExternalTool, {
					action: Action.write,
					requiredPermissions: [permissionA],
				});

				expect(res).toBe(false);
			});
		});

		describe('when user has CAN_EXECUTE_INSTANCE_OPERATIONS permission', () => {
			describe('when user has instance operation permission for read action', () => {
				const setup = () => {
					const role = roleFactory.build({ permissions: [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS] });
					const school = schoolEntityFactory.build();
					const otherSchool = schoolEntityFactory.build();
					const entity = schoolExternalToolEntityFactory.build();
					entity.school = otherSchool;
					const user = userFactory.build({ roles: [role], school });

					return { user, entity };
				};

				it('should return "true" even without being at the same school', () => {
					const { user, entity } = setup();

					const res = service.hasPermission(user, entity, { action: Action.read, requiredPermissions: [] });

					expect(res).toBe(true);
				});
			});

			describe('when user has instance operation permission for write action', () => {
				const setup = () => {
					const role = roleFactory.build({ permissions: [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS] });
					const school = schoolEntityFactory.build();
					const otherSchool = schoolEntityFactory.build();
					const entity = schoolExternalToolEntityFactory.build();
					entity.school = otherSchool;
					const user = userFactory.build({ roles: [role], school });

					return { user, entity };
				};

				it('should return "true" even without being at the same school', () => {
					const { user, entity } = setup();

					const res = service.hasPermission(user, entity, { action: Action.write, requiredPermissions: [] });

					expect(res).toBe(true);
				});
			});

			describe('when user has instance operation permission but missing required permissions', () => {
				const setup = () => {
					const missingPermission = 'missing' as Permission;
					const role = roleFactory.build({ permissions: [Permission.CAN_EXECUTE_INSTANCE_OPERATIONS] });
					const school = schoolEntityFactory.build();
					const otherSchool = schoolEntityFactory.build();
					const entity = schoolExternalToolEntityFactory.build();
					entity.school = otherSchool;
					const user = userFactory.build({ roles: [role], school });

					return { user, entity, missingPermission };
				};

				it('should return "false" when required permissions are not met', () => {
					const { user, entity, missingPermission } = setup();

					const res = service.hasPermission(user, entity, {
						action: Action.read,
						requiredPermissions: [missingPermission],
					});

					expect(res).toBe(false);
				});
			});
		});

		describe('when the action is not read or write', () => {
			const setup = () => {
				const role = roleFactory.build({ permissions: [] });
				const school = schoolEntityFactory.build();
				const entity = schoolExternalToolEntityFactory.build();
				entity.school = school;
				const user = userFactory.build({ roles: [role], school });

				return { user, entity };
			};

			it('should throw NotImplementedException', () => {
				const { user, entity } = setup();

				expect(() =>
					service.hasPermission(user, entity, { action: 'unknown' as Action, requiredPermissions: [] })
				).toThrow(NotImplementedException);
			});
		});
	});
});
