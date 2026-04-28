import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	Action,
	AuthorizationContextBuilder,
	AuthorizationHelper,
	AuthorizationInjectionService,
} from '@modules/authorization';
import { SchoolSystemOptions } from '@modules/legacy-school';
import { schoolSystemOptionsFactory } from '@modules/legacy-school/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { systemEntityFactory } from '@modules/system/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { SchoolSystemOptionsRule } from './school-system-options.rule';

describe(SchoolSystemOptionsRule.name, () => {
	let module: TestingModule;
	let rule: SchoolSystemOptionsRule;
	let injectionService: AuthorizationInjectionService;
	let authorizationHelper: DeepMocked<AuthorizationHelper>;

	beforeAll(async () => {
		await setupEntities([User]);

		module = await Test.createTestingModule({
			providers: [
				SchoolSystemOptionsRule,
				{
					provide: AuthorizationHelper,
					useValue: createMock<AuthorizationHelper>(),
				},
				AuthorizationInjectionService,
			],
		}).compile();

		rule = module.get(SchoolSystemOptionsRule);
		authorizationHelper = module.get(AuthorizationHelper);
		injectionService = module.get(AuthorizationInjectionService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('constructor', () => {
		it('should inject into AuthorizationInjectionService', () => {
			expect(injectionService.getAuthorizationRules()).toContain(rule);
		});
	});

	describe('isApplicable', () => {
		describe('when the entity is applicable', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const schoolSystemOptions: SchoolSystemOptions = schoolSystemOptionsFactory.build();

				return {
					user,
					schoolSystemOptions,
				};
			};

			it('should return true', () => {
				const { user, schoolSystemOptions } = setup();

				const result = rule.isApplicable(user, schoolSystemOptions);

				expect(result).toEqual(true);
			});
		});

		describe('when the entity is not applicable', () => {
			const setup = () => {
				const user = userFactory.buildWithId();

				return {
					user,
				};
			};

			it('should return false', () => {
				const { user } = setup();

				const result = rule.isApplicable(user, {} as unknown as SchoolSystemOptions);

				expect(result).toEqual(false);
			});
		});
	});

	describe('hasPermission', () => {
		describe('when the user accesses a system at his school with the required permissions', () => {
			const setup = () => {
				const systemEntity = systemEntityFactory.buildWithId();
				const school = schoolEntityFactory.buildWithId({
					systems: [systemEntity],
				});
				const schoolSystemOptions: SchoolSystemOptions = schoolSystemOptionsFactory.build({
					systemId: systemEntity.id,
					schoolId: school.id,
				});
				const user = userFactory.buildWithId({ school });
				const authorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_SYSTEM_VIEW]);

				authorizationHelper.hasAllPermissions.mockReturnValueOnce(true);

				return {
					user,
					schoolSystemOptions,
					authorizationContext,
				};
			};

			it('should check the permission', () => {
				const { user, schoolSystemOptions, authorizationContext } = setup();

				rule.hasPermission(user, schoolSystemOptions, authorizationContext);

				expect(authorizationHelper.hasAllPermissions).toHaveBeenCalledWith(
					user,
					authorizationContext.requiredPermissions
				);
			});

			it('should return true', () => {
				const { user, schoolSystemOptions, authorizationContext } = setup();

				const result = rule.hasPermission(user, schoolSystemOptions, authorizationContext);

				expect(result).toEqual(true);
			});
		});

		describe('when the user accesses a system at his school, but does not have the required permissions', () => {
			const setup = () => {
				const systemEntity = systemEntityFactory.buildWithId();
				const school = schoolEntityFactory.buildWithId({
					systems: [systemEntity],
				});
				const schoolSystemOptions: SchoolSystemOptions = schoolSystemOptionsFactory.build({
					systemId: systemEntity.id,
					schoolId: school.id,
				});
				const user = userFactory.buildWithId({ school });
				const authorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_SYSTEM_VIEW]);

				authorizationHelper.hasAllPermissions.mockReturnValueOnce(false);

				return {
					user,
					schoolSystemOptions,
					authorizationContext,
				};
			};

			it('should return false', () => {
				const { user, schoolSystemOptions, authorizationContext } = setup();

				const result = rule.hasPermission(user, schoolSystemOptions, authorizationContext);

				expect(result).toEqual(false);
			});
		});

		describe('when the system is not part of the users school', () => {
			const setup = () => {
				const systemEntity = systemEntityFactory.buildWithId();
				const school = schoolEntityFactory.buildWithId({
					systems: [systemEntity],
				});
				const schoolSystemOptions: SchoolSystemOptions = schoolSystemOptionsFactory.build({
					systemId: new ObjectId().toHexString(),
					schoolId: school.id,
				});
				const user = userFactory.buildWithId({ school });
				const authorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_SYSTEM_VIEW]);

				authorizationHelper.hasAllPermissions.mockReturnValueOnce(true);

				return {
					user,
					schoolSystemOptions,
					authorizationContext,
				};
			};

			it('should return false', () => {
				const { user, schoolSystemOptions, authorizationContext } = setup();

				const result = rule.hasPermission(user, schoolSystemOptions, authorizationContext);

				expect(result).toEqual(false);
			});
		});

		describe('when the user is not at the school', () => {
			const setup = () => {
				const schoolSystemOptions = schoolSystemOptionsFactory.build();
				const systemEntity = systemEntityFactory.buildWithId();
				const school = schoolEntityFactory.buildWithId({
					systems: [systemEntity],
				});
				const user = userFactory.buildWithId({ school });
				const authorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_SYSTEM_VIEW]);

				authorizationHelper.hasAllPermissions.mockReturnValueOnce(true);

				return {
					user,
					schoolSystemOptions,
					authorizationContext,
				};
			};

			it('should return false', () => {
				const { user, schoolSystemOptions, authorizationContext } = setup();

				const result = rule.hasPermission(user, schoolSystemOptions, authorizationContext);

				expect(result).toEqual(false);
			});
		});

		describe('when the user accesses a system at his school with write action', () => {
			const setup = () => {
				const systemEntity = systemEntityFactory.buildWithId();
				const school = schoolEntityFactory.buildWithId({
					systems: [systemEntity],
				});
				const schoolSystemOptions: SchoolSystemOptions = schoolSystemOptionsFactory.build({
					systemId: systemEntity.id,
					schoolId: school.id,
				});
				const user = userFactory.buildWithId({ school });
				const authorizationContext = AuthorizationContextBuilder.write([Permission.SCHOOL_SYSTEM_EDIT]);

				authorizationHelper.hasAllPermissions.mockReturnValueOnce(true);

				return {
					user,
					schoolSystemOptions,
					authorizationContext,
				};
			};

			it('should return true', () => {
				const { user, schoolSystemOptions, authorizationContext } = setup();

				const result = rule.hasPermission(user, schoolSystemOptions, authorizationContext);

				expect(result).toEqual(true);
			});
		});

		describe('when the action is not read or write', () => {
			const setup = () => {
				const systemEntity = systemEntityFactory.buildWithId();
				const school = schoolEntityFactory.buildWithId({
					systems: [systemEntity],
				});
				const schoolSystemOptions: SchoolSystemOptions = schoolSystemOptionsFactory.build({
					systemId: systemEntity.id,
					schoolId: school.id,
				});
				const user = userFactory.buildWithId({ school });
				const authorizationContext = {
					action: 'unknown' as Action,
					requiredPermissions: [],
				};

				return {
					user,
					schoolSystemOptions,
					authorizationContext,
				};
			};

			it('should throw NotImplementedException', () => {
				const { user, schoolSystemOptions, authorizationContext } = setup();

				expect(() => rule.hasPermission(user, schoolSystemOptions, authorizationContext)).toThrow(
					NotImplementedException
				);
			});
		});

		describe('when user has CAN_EXECUTE_INSTANCE_OPERATIONS permission', () => {
			describe('when user has instance operation permission for read action', () => {
				const setup = () => {
					const schoolSystemOptions = schoolSystemOptionsFactory.build();
					const systemEntity = systemEntityFactory.buildWithId();
					const school = schoolEntityFactory.buildWithId({
						systems: [systemEntity],
					});
					const user = userFactory.buildWithId({ school });
					const authorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_SYSTEM_VIEW]);

					authorizationHelper.hasAllPermissions.mockImplementation((u, permissions) => {
						if (permissions.includes(Permission.CAN_EXECUTE_INSTANCE_OPERATIONS)) {
							return true;
						}
						return false;
					});

					return {
						user,
						schoolSystemOptions,
						authorizationContext,
					};
				};

				it('should return true even without being at the school or having the system', () => {
					const { user, schoolSystemOptions, authorizationContext } = setup();

					const result = rule.hasPermission(user, schoolSystemOptions, authorizationContext);

					expect(result).toEqual(true);
				});
			});

			describe('when user has instance operation permission for write action', () => {
				const setup = () => {
					const schoolSystemOptions = schoolSystemOptionsFactory.build();
					const systemEntity = systemEntityFactory.buildWithId();
					const school = schoolEntityFactory.buildWithId({
						systems: [systemEntity],
					});
					const user = userFactory.buildWithId({ school });
					const authorizationContext = AuthorizationContextBuilder.write([Permission.SCHOOL_SYSTEM_VIEW]);

					authorizationHelper.hasAllPermissions.mockImplementation((u, permissions) => {
						if (permissions.includes(Permission.CAN_EXECUTE_INSTANCE_OPERATIONS)) {
							return true;
						}
						return false;
					});

					return {
						user,
						schoolSystemOptions,
						authorizationContext,
					};
				};

				it('should return true even without being at the school or having the system', () => {
					const { user, schoolSystemOptions, authorizationContext } = setup();

					const result = rule.hasPermission(user, schoolSystemOptions, authorizationContext);

					expect(result).toEqual(true);
				});
			});

			describe('when user does not have instance operation permission', () => {
				const setup = () => {
					const schoolSystemOptions = schoolSystemOptionsFactory.build();
					const systemEntity = systemEntityFactory.buildWithId();
					const school = schoolEntityFactory.buildWithId({
						systems: [systemEntity],
					});
					const user = userFactory.buildWithId({ school });
					const authorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_SYSTEM_VIEW]);

					authorizationHelper.hasAllPermissions.mockReturnValue(false);

					return {
						user,
						schoolSystemOptions,
						authorizationContext,
					};
				};

				it('should return false when not at school and missing instance operation permission', () => {
					const { user, schoolSystemOptions, authorizationContext } = setup();

					const result = rule.hasPermission(user, schoolSystemOptions, authorizationContext);

					expect(result).toEqual(false);
				});
			});
		});
	});
});
