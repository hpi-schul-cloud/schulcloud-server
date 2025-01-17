import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	AuthorizationContextBuilder,
	AuthorizationHelper,
	AuthorizationInjectionService,
} from '@modules/authorization';
import { SchoolSystemOptions } from '@modules/legacy-school';
import { schoolSystemOptionsFactory } from '@modules/legacy-school/testing';
import { SystemEntity } from '@modules/system/entity';
import { systemEntityFactory } from '@modules/system/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolEntity, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { schoolEntityFactory } from '@testing/factory/school-entity.factory';
import { userFactory } from '@testing/factory/user.factory';
import { setupEntities } from '@testing/setup-entities';
import { SchoolSystemOptionsRule } from './school-system-options.rule';

describe(SchoolSystemOptionsRule.name, () => {
	let module: TestingModule;
	let rule: SchoolSystemOptionsRule;
	let injectionService: AuthorizationInjectionService;

	let authorizationHelper: DeepMocked<AuthorizationHelper>;

	beforeAll(async () => {
		await setupEntities();

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
				const user: User = userFactory.buildWithId();
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
				const user: User = userFactory.buildWithId();

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
				const systemEntity: SystemEntity = systemEntityFactory.buildWithId();
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [systemEntity],
				});
				const schoolSystemOptions: SchoolSystemOptions = schoolSystemOptionsFactory.build({
					systemId: systemEntity.id,
					schoolId: school.id,
				});
				const user: User = userFactory.buildWithId({ school });
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
				const systemEntity: SystemEntity = systemEntityFactory.buildWithId();
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [systemEntity],
				});
				const schoolSystemOptions: SchoolSystemOptions = schoolSystemOptionsFactory.build({
					systemId: systemEntity.id,
					schoolId: school.id,
				});
				const user: User = userFactory.buildWithId({ school });
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
				const systemEntity: SystemEntity = systemEntityFactory.buildWithId();
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [systemEntity],
				});
				const schoolSystemOptions: SchoolSystemOptions = schoolSystemOptionsFactory.build({
					systemId: new ObjectId().toHexString(),
					schoolId: school.id,
				});
				const user: User = userFactory.buildWithId({ school });
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
				const schoolSystemOptions: SchoolSystemOptions = schoolSystemOptionsFactory.build();
				const systemEntity: SystemEntity = systemEntityFactory.buildWithId();
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [systemEntity],
				});
				const user: User = userFactory.buildWithId({ school });
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
	});
});
