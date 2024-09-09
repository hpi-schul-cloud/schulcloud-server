import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { System } from '@modules/system';
import { SystemEntity } from '@modules/system/entity';
import { systemFactory } from '@modules/system/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolEntity, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { schoolEntityFactory, setupEntities, systemEntityFactory, userFactory } from '@shared/testing';
import { AuthorizationContextBuilder } from '../mapper';
import { AuthorizationHelper } from '../service/authorization.helper';
import { SystemRule } from './system.rule';

describe(SystemRule.name, () => {
	let module: TestingModule;
	let rule: SystemRule;

	let authorizationHelper: DeepMocked<AuthorizationHelper>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				SystemRule,
				{
					provide: AuthorizationHelper,
					useValue: createMock<AuthorizationHelper>(),
				},
			],
		}).compile();

		rule = module.get(SystemRule);
		authorizationHelper = module.get(AuthorizationHelper);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('isApplicable', () => {
		describe('when the entity is applicable', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();
				const system: System = systemFactory.build();

				return {
					user,
					system,
				};
			};

			it('should return true', () => {
				const { user, system } = setup();

				const result = rule.isApplicable(user, system);

				expect(result).toEqual(true);
			});
		});

		describe('when the entity is not applicable', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();

				return {
					user,
				};
			};

			it('should return false', () => {
				const { user } = setup();

				const result = rule.isApplicable(user, {} as unknown as System);

				expect(result).toEqual(false);
			});
		});
	});

	describe('hasPermission', () => {
		describe('when the user reads a system at his school and has the required permission', () => {
			const setup = () => {
				const system: System = systemFactory.build();
				const systemEntity: SystemEntity = systemEntityFactory.buildWithId(undefined, system.id);
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [systemEntity],
				});
				const user: User = userFactory.buildWithId({ school });
				const authorizationContext = AuthorizationContextBuilder.read([Permission.SYSTEM_VIEW]);

				authorizationHelper.hasAllPermissions.mockReturnValueOnce(true);

				return {
					user,
					system,
					authorizationContext,
				};
			};

			it('should check the permission', () => {
				const { user, system, authorizationContext } = setup();

				rule.hasPermission(user, system, authorizationContext);

				expect(authorizationHelper.hasAllPermissions).toHaveBeenCalledWith(
					user,
					authorizationContext.requiredPermissions
				);
			});

			it('should return true', () => {
				const { user, system, authorizationContext } = setup();

				const result = rule.hasPermission(user, system, authorizationContext);

				expect(result).toEqual(true);
			});
		});

		describe('when the user reads a system, but does not have the permission', () => {
			const setup = () => {
				const system: System = systemFactory.build();
				const systemEntity: SystemEntity = systemEntityFactory.buildWithId(undefined, system.id);
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [systemEntity],
				});
				const user: User = userFactory.buildWithId({ school });
				const authorizationContext = AuthorizationContextBuilder.read([Permission.SYSTEM_VIEW]);

				authorizationHelper.hasAllPermissions.mockReturnValueOnce(false);

				return {
					user,
					system,
					authorizationContext,
				};
			};

			it('should return false', () => {
				const { user, system, authorizationContext } = setup();

				const result = rule.hasPermission(user, system, authorizationContext);

				expect(result).toEqual(false);
			});
		});

		describe('when the user reads a system that is not at his school', () => {
			const setup = () => {
				const system: System = systemFactory.build();
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [],
				});
				const user: User = userFactory.buildWithId({ school });
				const authorizationContext = AuthorizationContextBuilder.read([Permission.SYSTEM_VIEW]);

				authorizationHelper.hasAllPermissions.mockReturnValueOnce(true);

				return {
					user,
					system,
					authorizationContext,
				};
			};

			it('should return false', () => {
				const { user, system, authorizationContext } = setup();

				const result = rule.hasPermission(user, system, authorizationContext);

				expect(result).toEqual(false);
			});
		});

		describe('when the user writes a ldap system at his school and has the required permission and the ldap provider is "general"', () => {
			const setup = () => {
				const system: System = systemFactory.build({ ldapConfig: { provider: 'general' } });
				const systemEntity: SystemEntity = systemEntityFactory.buildWithId(undefined, system.id);
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [systemEntity],
				});
				const user: User = userFactory.buildWithId({ school });
				const authorizationContext = AuthorizationContextBuilder.write([Permission.SYSTEM_CREATE]);

				authorizationHelper.hasAllPermissions.mockReturnValueOnce(true);

				return {
					user,
					system,
					authorizationContext,
				};
			};

			it('should return true', () => {
				const { user, system, authorizationContext } = setup();

				const result = rule.hasPermission(user, system, authorizationContext);

				expect(result).toEqual(true);
			});
		});

		describe('when the user writes a ldap system at his school and has the required permission and the ldap provider is not "general"', () => {
			const setup = () => {
				const system: System = systemFactory.build({ ldapConfig: { provider: 'other provider' } });
				const systemEntity: SystemEntity = systemEntityFactory.buildWithId(undefined, system.id);
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [systemEntity],
				});
				const user: User = userFactory.buildWithId({ school });
				const authorizationContext = AuthorizationContextBuilder.write([Permission.SYSTEM_CREATE]);

				authorizationHelper.hasAllPermissions.mockReturnValueOnce(true);

				return {
					user,
					system,
					authorizationContext,
				};
			};

			it('should return false', () => {
				const { user, system, authorizationContext } = setup();

				const result = rule.hasPermission(user, system, authorizationContext);

				expect(result).toEqual(false);
			});
		});

		describe('when the user writes a non-ldap system at his school and has the required permission', () => {
			const setup = () => {
				const system: System = systemFactory.build({ ldapConfig: undefined });
				const systemEntity: SystemEntity = systemEntityFactory.buildWithId(undefined, system.id);
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [systemEntity],
				});
				const user: User = userFactory.buildWithId({ school });
				const authorizationContext = AuthorizationContextBuilder.write([Permission.SYSTEM_CREATE]);

				authorizationHelper.hasAllPermissions.mockReturnValueOnce(true);

				return {
					user,
					system,
					authorizationContext,
				};
			};

			it('should return false', () => {
				const { user, system, authorizationContext } = setup();

				const result = rule.hasPermission(user, system, authorizationContext);

				expect(result).toEqual(false);
			});
		});
	});
});
